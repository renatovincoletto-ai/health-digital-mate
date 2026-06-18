import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listTerminals, saveTerminal, listTefTransactions } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/maquininhas")({ component: Page });

function Page() {
  const fetchT = useServerFn(listTerminals);
  const fetchX = useServerFn(listTefTransactions);
  const save = useServerFn(saveTerminal);
  const qc = useQueryClient();
  const { data: terminals = [] } = useQuery({ queryKey: ["pos"], queryFn: () => fetchT() });
  const { data: tx = [] } = useQuery({ queryKey: ["tef"], queryFn: () => fetchX() });
  const [f, setF] = useState({ acquirer: "Stone", model: "", serial_number: "", label: "" });

  const saveM = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => { toast.success("Maquininha cadastrada"); setF({ acquirer: "Stone", model: "", serial_number: "", label: "" }); qc.invalidateQueries({ queryKey: ["pos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SimplePage title="Maquininhas & TEF" description="Cadastre POS físicas (Stone, Cielo, Rede, GetNet) e acompanhe transações de cartão integradas.">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Nova maquininha</h2>
          <div className="mt-4 space-y-3">
            <select value={f.acquirer} onChange={(e) => setF({ ...f, acquirer: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option>Stone</option><option>Cielo</option><option>Rede</option><option>GetNet</option><option>PagSeguro</option><option>SafraPay</option>
            </select>
            <input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder="Modelo" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.serial_number} onChange={(e) => setF({ ...f, serial_number: e.target.value })} placeholder="Nº de série" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Apelido (ex: Recepção)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => saveM.mutate()} disabled={!f.acquirer || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Adicionar</button>
          </div>
          <div className="mt-6 space-y-2">
            {terminals.map((t: any) => (
              <div key={t.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{t.acquirer} {t.model && `· ${t.model}`}</p>
                <p className="text-xs text-muted-foreground">{t.label} · {t.serial_number}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold">Últimas transações TEF</h2>
          <div className="mt-4 space-y-2">
            {tx.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma transação ainda. Integre sua maquininha para capturar transações automaticamente.</p>}
            {tx.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{t.brand} · {t.installments}x</p>
                  <p className="text-xs text-muted-foreground">NSU {t.nsu} · {new Date(t.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <p className="font-semibold">R$ {Number(t.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SimplePage>
  );
}
