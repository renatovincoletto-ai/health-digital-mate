import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Mic, Square, Sparkles, Loader2, Stethoscope, MessageCircle, Check, History, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  listConsultationNotes,
  generateSoapNote,
  transcribeConsultationAudio,
  markConsultationWhatsappSent,
} from "@/lib/wave5.functions";
import { listProfessionalsForNote, patientTimeline } from "@/lib/waveE.functions";

export const Route = createFileRoute("/_authenticated/prontuario")({
  component: ProntuarioPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result || "");
      resolve(s.split(",")[1] || "");
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function ProntuarioPage() {
  const fetchNotes = useServerFn(listConsultationNotes);
  const genFn = useServerFn(generateSoapNote);
  const sttFn = useServerFn(transcribeConsultationAudio);
  const markWaFn = useServerFn(markConsultationWhatsappSent);
  const prosFn = useServerFn(listProfessionalsForNote);
  const timelineFn = useServerFn(patientTimeline);
  const qc = useQueryClient();

  const { data: notes } = useQuery({ queryKey: ["consultation-notes"], queryFn: () => fetchNotes() });
  const { data: pros } = useQuery({ queryKey: ["pros-for-note"], queryFn: () => prosFn() });

  const [patient, setPatient] = useState("");
  const [phone, setPhone] = useState("");
  const [transcript, setTranscript] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [professionalId, setProfessionalId] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // History panel state
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyPatient, setHistoryPatient] = useState("");
  const history = useQuery({
    queryKey: ["patient-timeline", historyPatient],
    queryFn: () => timelineFn({ data: { patient_name: historyPatient } }),
    enabled: !!historyPatient,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) {
        stream.getTracks().forEach((t) => t.stop());
        toast.error("Seu navegador não suporta gravação compatível.");
        return;
      }
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        if (blob.size < 2048) { toast.error("Gravação muito curta."); return; }
        setTranscribing(true);
        try {
          const b64 = await blobToBase64(blob);
          const { text } = await sttFn({ data: { audio_base64: b64, mime: rec.mimeType } });
          if (text) setTranscript((prev) => (prev ? prev + " " : "") + text);
          toast.success("Áudio transcrito");
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setTranscribing(false);
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Permissão de microfone negada.");
    }
  };

  const stopRecording = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const genMut = useMutation({
    mutationFn: () => genFn({
      data: {
        patient_name: patient,
        patient_phone: phone || null,
        transcript,
        specialty,
        professional_id: professionalId || null,
      },
    }),
    onSuccess: () => {
      toast.success("Nota SOAP + resumo gerados");
      setPatient(""); setPhone(""); setTranscript("");
      qc.invalidateQueries({ queryKey: ["consultation-notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendWhats = async (note: { id: string; patient_phone: string | null; patient_summary: string | null; patient_name: string }) => {
    if (!note.patient_phone) { toast.error("Cadastre o telefone do paciente."); return; }
    if (!note.patient_summary) { toast.error("Resumo indisponível."); return; }
    const digits = note.patient_phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá, ${note.patient_name}!\n\nSegue o resumo da sua consulta:\n\n${note.patient_summary}\n\nAtenciosamente.`);
    window.open(`https://wa.me/${digits}?text=${msg}`, "_blank");
    try { await markWaFn({ data: { id: note.id } }); qc.invalidateQueries({ queryKey: ["consultation-notes"] }); } catch { /* ignore */ }
  };

  const proName = (id: string | null | undefined) =>
    id ? (pros?.find((p: any) => p.id === id)?.full_name ?? "Profissional") : "—";

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Prontuário</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Gravação, nota SOAP & histórico do paciente</h1>
          <p className="mt-1.5 text-muted-foreground">Grave a consulta, vincule ao profissional atendente e veja todo o histórico do paciente entre profissionais da clínica.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="Paciente" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp (DDI+DDD+nº)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select
                value={professionalId}
                onChange={(e) => {
                  setProfessionalId(e.target.value);
                  const p = pros?.find((x: any) => x.id === e.target.value);
                  if (p?.specialty && !specialty) setSpecialty(p.specialty);
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Profissional atendente…</option>
                {pros?.filter((p: any) => p.is_active !== false).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.full_name}{p.specialty ? ` — ${p.specialty}` : ""}</option>
                ))}
              </select>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Especialidade" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {!recording ? (
                <button onClick={startRecording} disabled={transcribing} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50">
                  <Mic className="h-4 w-4" /> Gravar consulta
                </button>
              ) : (
                <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
                  <Square className="h-4 w-4" /> Parar e transcrever
                </button>
              )}
              {recording && <span className="text-xs text-muted-foreground">Gravando…</span>}
              {transcribing && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Transcrevendo com IA…</span>}
            </div>
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="A transcrição aparece aqui — você pode editar antes de gerar a nota." rows={12} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => genMut.mutate()} disabled={genMut.isPending || !patient || transcript.length < 20} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar SOAP + resumo
            </button>

            {/* Patient history search */}
            <div className="mt-8 rounded-xl border border-dashed border-border bg-background/40 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Histórico do paciente entre profissionais</h3>
              <p className="mt-1 text-xs text-muted-foreground">Pesquise pelo nome do paciente para ver todos os atendimentos anteriores, com profissional, data e orientações.</p>
              <form
                onSubmit={(e) => { e.preventDefault(); setHistoryPatient(historyQuery.trim()); }}
                className="mt-3 flex gap-2"
              >
                <input
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Nome do paciente…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                  <Search className="h-3.5 w-3.5" /> Buscar
                </button>
              </form>

              {history.isFetching && <p className="mt-3 text-xs text-muted-foreground">Carregando…</p>}
              {history.data && (
                <div className="mt-4 space-y-3">
                  {history.data.providers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {history.data.providers.map((p: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px]">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.professional?.color ?? "#999" }} />
                          {p.professional?.full_name ?? "Sem profissional"} · {p.count} atend.
                        </span>
                      ))}
                    </div>
                  )}
                  {history.data.notes.length === 0 && <p className="text-xs text-muted-foreground">Sem atendimentos para este paciente.</p>}
                  {history.data.notes.map((n: any) => (
                    <details key={n.id} className="rounded-lg border border-border bg-background p-3 text-xs">
                      <summary className="cursor-pointer">
                        <span className="font-medium">{new Date(n.created_at).toLocaleString("pt-BR")}</span>
                        <span className="ml-2 text-muted-foreground">com {n.professional?.full_name ?? "—"}{n.professional?.specialty ? ` (${n.professional.specialty})` : ""}</span>
                      </summary>
                      <div className="mt-2 space-y-1">
                        {n.soap_assessment && <p><strong>Avaliação:</strong> {n.soap_assessment}</p>}
                        {n.soap_plan && <p><strong>Conduta/Orientações:</strong> {n.soap_plan}</p>}
                        {n.patient_summary && <p className="text-muted-foreground italic">Resumo enviado: {n.patient_summary}</p>}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="font-display font-semibold flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Notas recentes</h3>
            <div className="mt-3 space-y-3">
              {notes?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma nota ainda.</p>}
              {notes?.map((n: any) => (
                <details key={n.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <summary className="cursor-pointer font-medium">
                    {n.patient_name}
                    <span className="ml-1 text-xs text-muted-foreground">· {new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
                    <span className="ml-1 text-[10px] text-muted-foreground">· {proName(n.professional_id)}</span>
                  </summary>
                  <div className="mt-3 space-y-2 text-xs">
                    {n.soap_subjective && <p><strong>S:</strong> {n.soap_subjective}</p>}
                    {n.soap_objective && <p><strong>O:</strong> {n.soap_objective}</p>}
                    {n.soap_assessment && <p><strong>A:</strong> {n.soap_assessment}</p>}
                    {n.soap_plan && <p><strong>P:</strong> {n.soap_plan}</p>}
                    {n.patient_summary && (
                      <div className="mt-2 rounded-md border border-border bg-surface p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo do paciente</p>
                        <p className="mt-1 whitespace-pre-line text-xs">{n.patient_summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => sendWhats(n)}
                      disabled={!n.patient_phone || !n.patient_summary}
                      className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-success-foreground disabled:opacity-50"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar no WhatsApp
                    </button>
                    {n.whatsapp_sent_at && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Check className="h-3 w-3" /> enviado {new Date(n.whatsapp_sent_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
