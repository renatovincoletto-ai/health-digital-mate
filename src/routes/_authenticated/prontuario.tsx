import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Mic, Square, Sparkles, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listConsultationNotes, generateSoapNote } from "@/lib/wave5.functions";

export const Route = createFileRoute("/_authenticated/prontuario")({
  component: ProntuarioPage,
});

function ProntuarioPage() {
  const fetchNotes = useServerFn(listConsultationNotes);
  const genFn = useServerFn(generateSoapNote);
  const qc = useQueryClient();
  const { data: notes } = useQuery({ queryKey: ["consultation-notes"], queryFn: () => fetchNotes() });

  const [patient, setPatient] = useState("");
  const [transcript, setTranscript] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [recording, setRecording] = useState(false);
  const recogRef = useRef<{ stop: () => void } | null>(null);

  const startDictation = () => {
    const SR = (window as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown }).webkitSpeechRecognition
      || (window as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown }).SpeechRecognition;
    if (!SR) { toast.error("Seu navegador não suporta ditado por voz. Use o Chrome."); return; }
    const recog = new (SR as new () => {
      lang: string; continuous: boolean; interimResults: boolean;
      onresult: (e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void;
      onend: () => void; onerror: () => void; start: () => void; stop: () => void;
    })();
    recog.lang = "pt-BR"; recog.continuous = true; recog.interimResults = true;
    recog.onresult = (e) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) txt += e.results[i][0].transcript + " ";
      }
      if (txt) setTranscript((prev) => prev + txt);
    };
    recog.onend = () => setRecording(false);
    recog.onerror = () => setRecording(false);
    recog.start();
    recogRef.current = recog;
    setRecording(true);
  };

  const stopDictation = () => { recogRef.current?.stop(); setRecording(false); };

  const genMut = useMutation({
    mutationFn: () => genFn({ data: { patient_name: patient, transcript, specialty } }),
    onSuccess: () => { toast.success("Nota SOAP gerada"); setPatient(""); setTranscript(""); qc.invalidateQueries({ queryKey: ["consultation-notes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Prontuário</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Transcrição & nota SOAP por IA</h1>
          <p className="mt-1.5 text-muted-foreground">Ditе ou cole a consulta. A IA estrutura em S/O/A/P. Os dados ficam no seu consultório, protegidos por LGPD.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="Paciente" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Especialidade" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {!recording ? (
                <button onClick={startDictation} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium">
                  <Mic className="h-4 w-4" /> Ditar
                </button>
              ) : (
                <button onClick={stopDictation} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
                  <Square className="h-4 w-4" /> Parar
                </button>
              )}
              {recording && <span className="text-xs text-muted-foreground">Ouvindo… fale em português</span>}
            </div>
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Transcrição ou anotações da consulta…" rows={14} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => genMut.mutate()} disabled={genMut.isPending || !patient || transcript.length < 20} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar nota SOAP
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
