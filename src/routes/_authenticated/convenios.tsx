import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building } from "lucide-react";
import { toast } from "sonner";
import { SimplePage } from "@/components/simple-page";
import { listInsurancePlans, saveInsurancePlan } from "@/lib/wave9.functions";

export const Route = createFileRoute("/_authenticated/convenios")({ component: Page });

function Page() {
  const fetchAll = useServerFn(listInsurancePlans);
  const save = useServerFn(saveInsurancePlan);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["insurance-plans"], queryFn: () => fetchAll() });
  const [f, setF] = useState({ operator_name: "", plan_name: "", ans_code: "", contract_number: "" });

  const saveM = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => { toast.success("Convênio cadastrado"); setF({ operator_name: "", plan_name: "", ans_code: "", contract_number: "" }); qc.invalidateQueries({ queryKey: ["insurance-plans"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SimplePage title="Convênios" description="Cadastro de operadoras e planos de saúde aceitos. Use junto com Guias TISS para faturamento.">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold flex items-center gap-2"><Building className="h-4 w-4" /> Novo convênio</h2>
          <div className="mt-4 space-y-3">
            <input value={f.operator_name} onChange={(e) => setF({ ...f, operator_name: e.target.value })} placeholder="Operadora (ex: Unimed)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.plan_name} onChange={(e) => setF({ ...f, plan_name: e.target.value })} placeholder="Nome do plano" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.ans_code} onChange={(e) => setF({ ...f, ans_code: e.target.value })} placeholder="Registro ANS" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={f.contract_number} onChange={(e) => setF({ ...f, contract_number: e.target.value })} placeholder="Nº contrato" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={() => saveM.mutate()} disabled={!f.operator_name || !f.plan_name || saveM.isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Adicionar</button>
          </div>
        </section>
        <div className="space-y-2">
          {data.map((p: any) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface-elevated p-4">
              <p className="font-medium">{p.operator_name} · {p.plan_name}</p>
              <p className="text-xs text-muted-foreground">ANS {p.ans_code || "—"} · Contrato {p.contract_number || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}
