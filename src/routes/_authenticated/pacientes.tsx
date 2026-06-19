import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Trash2, Users, Search, Camera, Paperclip, Archive,
  AlertTriangle, Activity, FileText, X, Save, History, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  searchPatients, savePatientFull, getPatient, archivePatient,
  listInactivePatients, registerPatientAttachment, deletePatientAttachment,
  signAttachmentUrl, savePatientAllergy, deletePatientAllergy,
} from "@/lib/wave7.functions";
import { listPatientWallet, addWalletTransaction, deleteWalletTransaction } from "@/lib/wallet.functions";

export const Route = createFileRoute("/_authenticated/pacientes")({ component: Page });

type PatientLite = {
  id: string; full_name: string; cpf?: string | null; phone?: string | null;
  email?: string | null; photo_url?: string | null; last_visit_at?: string | null;
  tags?: string[]; lifetime_value?: number;
};

const EMPTY_FORM = {
  id: undefined as string | undefined,
  full_name: "", cpf: "", rg: "", email: "", phone: "",
  birth_date: "", gender: "", marital_status: "", profession: "",
  blood_type: "", height_cm: "" as string, weight_kg: "" as string,
  allergies_summary: "", payment_preference: "", photo_url: "" as string | null,
  emergency_contact: { name: "", phone: "", relationship: "" },
  address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "" },
  notes: "", tags: "",
};

function Page() {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchPatients);
  const saveFn = useServerFn(savePatientFull);
  const archiveFn = useServerFn(archivePatient);
  const inactiveFn = useServerFn(listInactivePatients);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-search", debounced],
    queryFn: () => searchFn({ data: { q: debounced, limit: 100, only_active: true } }) as Promise<PatientLite[]>,
  });

  const { data: inactive = [] } = useQuery({
    queryKey: ["patients-inactive"],
    queryFn: () => inactiveFn({ data: { months: 12 } }) as Promise<any[]>,
    enabled: showInactive,
  });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">CRM Clínico</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Pacientes</h1>
            <p className="mt-1.5 text-muted-foreground">Ficha completa, prontuário, anexos e histórico multi-profissional.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInactive(v => !v)}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm hover:bg-accent/10 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Inativos
            </button>
            <button
              onClick={() => { setSelectedId(null); setShowForm(true); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Novo paciente
            </button>
          </div>
        </header>

        {/* Search bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, CPF, telefone ou e-mail…"
            className="w-full rounded-xl border border-border bg-surface-elevated pl-10 pr-4 py-3 text-sm"
          />
        </div>

        {showInactive && (
          <InactivePanel
            inactive={inactive}
            onClose={() => setShowInactive(false)}
            onArchive={async (id) => {
              await archiveFn({ data: { id, archived: true } });
              toast.success("Paciente arquivado");
              qc.invalidateQueries({ queryKey: ["patients-search"] });
              qc.invalidateQueries({ queryKey: ["patients-inactive"] });
            }}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 sticky top-0 bg-background py-1">
              <Users className="h-3 w-3" /> {patients.length} pacientes
            </p>
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setShowForm(false); }}
                className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition ${
                  selectedId === p.id ? "border-primary bg-primary/5" : "border-border bg-surface-elevated hover:border-primary/40"
                }`}
              >
                <Avatar url={p.photo_url} name={p.full_name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.cpf || "Sem CPF"} {p.phone && `· ${p.phone}`}
                  </p>
                  {p.last_visit_at && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Última visita: {new Date(p.last_visit_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {patients.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum paciente encontrado.
              </div>
            )}
          </section>

          <section>
            {showForm ? (
              <PatientForm
                initial={EMPTY_FORM}
                onCancel={() => setShowForm(false)}
                onSaved={(id) => { setShowForm(false); setSelectedId(id); qc.invalidateQueries({ queryKey: ["patients-search"] }); }}
              />
            ) : selectedId ? (
              <PatientDetail
                patientId={selectedId}
                onEdit={() => setShowForm(true)}
                onArchived={() => { setSelectedId(null); qc.invalidateQueries({ queryKey: ["patients-search"] }); }}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Selecione um paciente para ver a ficha completa, prontuário e anexos.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  if (url) return <img src={url} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  return (
    <div className="h-10 w-10 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
      {initials}
    </div>
  );
}

function InactivePanel({ inactive, onClose, onArchive }: { inactive: any[]; onClose: () => void; onArchive: (id: string) => void }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> Pacientes sem retorno há 12+ meses
        </h3>
        <button onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Arquive os que não retornarão para liberar espaço no seu pacote de pacientes.
      </p>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {inactive.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2 text-sm">
            <div>
              <span className="font-medium">{p.full_name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {p.last_visit_at ? `Última: ${new Date(p.last_visit_at).toLocaleDateString("pt-BR")}` : "Nunca atendido"}
              </span>
            </div>
            <button onClick={() => onArchive(p.id)} className="text-xs rounded-lg border border-border px-2 py-1 hover:bg-destructive/10 hover:border-destructive/40 flex items-center gap-1">
              <Archive className="h-3 w-3" /> Arquivar
            </button>
          </div>
        ))}
        {inactive.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum paciente inativo. 🎉</p>}
      </div>
    </div>
  );
}

function PatientForm({ initial, onCancel, onSaved }: {
  initial: typeof EMPTY_FORM; onCancel: () => void; onSaved: (id: string) => void;
}) {
  const [form, setForm] = useState(initial);
  const saveFn = useServerFn(savePatientFull);
  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...form,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      return saveFn({ data: payload });
    },
    onSuccess: (row: any) => { toast.success("Paciente salvo"); onSaved(row.id); },
    onError: (e: Error) => toast.error(e.message),
  });

  const bmi = useMemo(() => {
    const h = Number(form.height_cm), w = Number(form.weight_kg);
    if (!h || !w) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
  }, [form.height_cm, form.weight_kg]);

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{form.id ? "Editar paciente" : "Novo paciente"}</h2>
        <button onClick={onCancel}><X className="h-4 w-4" /></button>
      </div>

      <Section title="Identificação">
        <Field label="Nome completo *" value={form.full_name} onChange={v => setForm({ ...form, full_name: v })} />
        <Field label="CPF" value={form.cpf} onChange={v => setForm({ ...form, cpf: v })} />
        <Field label="RG" value={form.rg} onChange={v => setForm({ ...form, rg: v })} />
        <Field label="Data de nascimento" type="date" value={form.birth_date} onChange={v => setForm({ ...form, birth_date: v })} />
        <Select label="Gênero" value={form.gender} onChange={v => setForm({ ...form, gender: v })}
          options={["", "Feminino", "Masculino", "Outro", "Prefere não informar"]} />
        <Select label="Estado civil" value={form.marital_status} onChange={v => setForm({ ...form, marital_status: v })}
          options={["", "Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"]} />
        <Field label="Profissão" value={form.profession} onChange={v => setForm({ ...form, profession: v })} />
      </Section>

      <Section title="Contato">
        <Field label="Telefone / WhatsApp" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <Field label="E-mail" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <Field label="CEP" value={form.address.zip} onChange={v => setForm({ ...form, address: { ...form.address, zip: v } })} />
        <Field label="Cidade" value={form.address.city} onChange={v => setForm({ ...form, address: { ...form.address, city: v } })} />
        <Field label="UF" value={form.address.state} onChange={v => setForm({ ...form, address: { ...form.address, state: v } })} />
        <Field label="Logradouro" value={form.address.street} onChange={v => setForm({ ...form, address: { ...form.address, street: v } })} className="md:col-span-2" />
      </Section>

      <Section title="Saúde">
        <Select label="Tipo sanguíneo" value={form.blood_type} onChange={v => setForm({ ...form, blood_type: v })}
          options={["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
        <Field label="Altura (cm)" type="number" value={form.height_cm} onChange={v => setForm({ ...form, height_cm: v })} />
        <Field label="Peso (kg)" type="number" value={form.weight_kg} onChange={v => setForm({ ...form, weight_kg: v })} />
        <div className="rounded-lg bg-background border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">IMC (auto)</p>
          <p className="text-lg font-semibold">{bmi ?? "—"}</p>
        </div>
        <div className="md:col-span-3">
          <label className="text-xs text-muted-foreground">Resumo de alergias / observações clínicas</label>
          <textarea value={form.allergies_summary} onChange={e => setForm({ ...form, allergies_summary: e.target.value })}
            rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </Section>

      <Section title="Preferências">
        <Select label="Preferência de pagamento" value={form.payment_preference} onChange={v => setForm({ ...form, payment_preference: v })}
          options={["", "PIX", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Boleto", "Convênio"]} />
        <Field label="Tags (separadas por vírgula)" value={form.tags} onChange={v => setForm({ ...form, tags: v })} className="md:col-span-2" />
      </Section>

      <Section title="Contato de emergência">
        <Field label="Nome" value={form.emergency_contact.name} onChange={v => setForm({ ...form, emergency_contact: { ...form.emergency_contact, name: v } })} />
        <Field label="Telefone" value={form.emergency_contact.phone} onChange={v => setForm({ ...form, emergency_contact: { ...form.emergency_contact, phone: v } })} />
        <Field label="Parentesco" value={form.emergency_contact.relationship} onChange={v => setForm({ ...form, emergency_contact: { ...form.emergency_contact, relationship: v } })} />
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm">Cancelar</button>
        <button onClick={() => save.mutate()} disabled={!form.full_name || save.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 flex items-center gap-2">
          <Save className="h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    </div>
  );
}

function Select({ label, value, onChange, options, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select value={value ?? ""} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
        {options.map(o => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </div>
  );
}

function PatientDetail({ patientId, onEdit, onArchived }: {
  patientId: string; onEdit: () => void; onArchived: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getPatient);
  const archiveFn = useServerFn(archivePatient);
  const regFn = useServerFn(registerPatientAttachment);
  const delAttFn = useServerFn(deletePatientAttachment);
  const signFn = useServerFn(signAttachmentUrl);
  const savePatientFn = useServerFn(savePatientFull);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-detail", patientId],
    queryFn: () => getFn({ data: { id: patientId } }),
  });

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;

  const p = data.patient;

  const uploadFile = async (file: File, bucket: "patient-photos" | "patient-attachments", kind: "photo" | "exam" | "document") => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sessão expirada");
    const { data: tenantRow } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
    if (!tenantRow) return toast.error("Consultório não encontrado");
    const path = `${tenantRow.id}/${kind}/${patientId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (upErr) return toast.error(upErr.message);
    if (bucket === "patient-photos") {
      // signed url + save as patient photo
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 30);
      await savePatientFn({ data: { id: patientId, full_name: p.full_name, photo_url: signed?.signedUrl ?? null } as any });
      toast.success("Foto atualizada");
    } else {
      await regFn({ data: { patient_id: patientId, kind, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size } });
      toast.success("Anexo enviado");
    }
    qc.invalidateQueries({ queryKey: ["patient-detail", patientId] });
    qc.invalidateQueries({ queryKey: ["patients-search"] });
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-start gap-5">
          <div className="relative group">
            <Avatar url={p.photo_url} name={p.full_name} />
            <button onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground opacity-0 group-hover:opacity-100 transition">
              <Camera className="h-3 w-3" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "patient-photos", "photo")} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">{p.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {p.cpf && `CPF ${p.cpf}`} {p.birth_date && ` · Nasc ${new Date(p.birth_date).toLocaleDateString("pt-BR")}`}
                  {p.blood_type && ` · ${p.blood_type}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={onEdit} className="rounded-lg border border-border px-3 py-1.5 text-xs">Editar</button>
                <button onClick={async () => {
                  if (!confirm("Arquivar este paciente?")) return;
                  await archiveFn({ data: { id: patientId, archived: true } });
                  toast.success("Arquivado");
                  onArchived();
                }} className="rounded-lg border border-border px-3 py-1.5 text-xs text-destructive">
                  <Archive className="h-3 w-3 inline mr-1" /> Arquivar
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
              <Stat label="IMC" value={p.bmi ?? "—"} />
              <Stat label="Altura" value={p.height_cm ? `${p.height_cm}cm` : "—"} />
              <Stat label="Peso" value={p.weight_kg ? `${p.weight_kg}kg` : "—"} />
              <Stat label="LTV" value={`R$ ${Number(p.lifetime_value ?? 0).toFixed(2)}`} />
            </div>
            {p.allergies_summary && (
              <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs">
                <strong className="text-destructive">⚠ Alergias:</strong> {p.allergies_summary}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline / histórico multi-profissional */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-3">
          <History className="h-4 w-4" /> Histórico de atendimentos
        </h3>
        {data.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum atendimento registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {data.notes.map((n: any) => (
              <div key={n.id} className="border-l-2 border-primary/40 pl-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {n.professionals?.full_name ?? "Profissional"} 
                    <span className="ml-2 text-xs text-muted-foreground">
                      · {new Date(n.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </p>
                  <span className="text-[10px] rounded-full bg-accent/20 px-2 py-0.5">{n.status}</span>
                </div>
                {n.soap_subjective && <p className="text-xs text-muted-foreground mt-1 line-clamp-2"><strong>S:</strong> {n.soap_subjective}</p>}
                {n.soap_plan && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2"><strong>P:</strong> {n.soap_plan}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anexos do prontuário */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Anexos do prontuário ({data.attachments.length})
          </h3>
          <button onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground flex items-center gap-1">
            <Plus className="h-3 w-3" /> Enviar arquivo
          </button>
          <input ref={fileRef} type="file" className="hidden"
            onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "patient-attachments",
              e.target.files[0].type.startsWith("image/") ? "exam" : "document")} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.attachments.map((a: any) => (
            <AttachmentCard key={a.id} att={a}
              onOpen={async () => {
                const { url } = await signFn({ data: { storage_path: a.storage_path, bucket: "patient-attachments" } });
                window.open(url, "_blank");
              }}
              onDelete={async () => {
                if (!confirm("Excluir este anexo?")) return;
                await delAttFn({ data: { id: a.id } });
                qc.invalidateQueries({ queryKey: ["patient-detail", patientId] });
              }} />
          ))}
          {data.attachments.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground text-center py-6">Nenhum anexo ainda.</p>
          )}
        </div>
      </div>

      {/* Carteira do paciente */}
      <PatientWalletCard patientId={patientId} />





      {/* Prescrições */}
      {data.prescriptions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4" /> Prescrições recentes
          </h3>
          <div className="space-y-2">
            {data.prescriptions.map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-primary">{r.doc_type}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="mt-1 text-xs line-clamp-2">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function AttachmentCard({ att, onOpen, onDelete }: { att: any; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="group relative rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="h-3 w-3 text-primary" />
        <span className="text-[10px] uppercase tracking-wider">{att.kind}</span>
      </div>
      <p className="text-xs font-medium truncate">{att.file_name ?? "Anexo"}</p>
      <p className="text-[10px] text-muted-foreground">
        {new Date(att.created_at).toLocaleDateString("pt-BR")}
        {att.professionals?.full_name && ` · ${att.professionals.full_name}`}
      </p>
      <div className="mt-2 flex gap-1">
        <button onClick={onOpen} className="flex-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-primary/10">Abrir</button>
        <button onClick={onDelete} className="rounded-md border border-border px-2 py-1 text-[10px] hover:bg-destructive/10 hover:border-destructive/40">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
