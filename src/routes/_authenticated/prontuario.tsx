import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Mic, Square, Sparkles, Loader2, Stethoscope, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  listConsultationNotes,
  generateSoapNote,
  transcribeConsultationAudio,
  markConsultationWhatsappSent,
} from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/prontuario")({
  component: ProntuarioPage,
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
  const qc = useQueryClient();
  const { data: notes } = useQuery({ queryKey: ["consultation-notes"], queryFn: () => fetchNotes() });

  const [patient, setPatient] = useState("");
  const [phone, setPhone] = useState("");
  const [transcript, setTranscript] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
      streamRef.current = stream;
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
    mutationFn: () => genFn({ data: { patient_name: patient, patient_phone: phone || null, transcript, specialty } }),
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

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Prontuário</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Gravação, nota SOAP & resumo no WhatsApp</h1>
          <p className="mt-1.5 text-muted-foreground">Grave a consulta, a IA transcreve, gera a nota SOAP para a ficha e um resumo amigável para enviar ao paciente.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="Paciente" className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-1" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp (DDI+DDD+nº)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
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
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="A transcrição aparece aqui — você pode editar antes de gerar a nota." rows={14} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => genMut.mutate()} disabled={genMut.isPending || !patient || transcript.length < 20} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar SOAP + resumo
            </button>
          </section>

          <aside className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h3 className="font-display font-semibold flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Notas recentes</h3>
            <div className="mt-3 space-y-3">
              {notes?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma nota ainda.</p>}
              {notes?.map((n) => (
                <details key={n.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <summary className="cursor-pointer font-medium">{n.patient_name} <span className="text-xs text-muted-foreground">· {new Date(n.created_at).toLocaleDateString("pt-BR")}</span></summary>
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
                      onClick={() => sendWhats(n as { id: string; patient_phone: string | null; patient_summary: string | null; patient_name: string })}
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
