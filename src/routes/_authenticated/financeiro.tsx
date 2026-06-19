import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, Plus, CheckCircle2, ArrowUpRight, ArrowDownRight, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  listFinancialAccounts, saveFinancialAccount,
  listFinancialTransactions, saveTransaction, markTransactionPaid,
  listSplits, saveSplit,
  listPatients,
} from "@/lib/wave6.functions";
import { listWalletBalances } from "@/lib/wallet.functions";

export const Route = createFileRoute("/_authenticated/financeiro")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const accFn = useServerFn(listFinancialAccounts);
  const saveAcc = useServerFn(saveFinancialAccount);
  const txFn = useServerFn(listFinancialTransactions);
  const saveTx = useServerFn(saveTransaction);
  const payTx = useServerFn(markTransactionPaid);
  const splitFn = useServerFn(listSplits);
  const saveSp = useServerFn(saveSplit);
  const patFn = useServerFn(listPatients);

  const { data: accounts = [] } = useQuery({ queryKey: ["faccs"], queryFn: () => accFn() });
  const { data: txs = [] } = useQuery({ queryKey: ["ftxs"], queryFn: () => txFn() });
  const { data: splits = [] } = useQuery({ queryKey: ["splits"], queryFn: () => splitFn() });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => patFn() });

  const [tab, setTab] = useState<"tx" | "accounts" | "splits" | "wallets">("tx");
  const [accForm, setAccForm] = useState({ name: "", account_type: "bank", bank_name: "", balance: 0 });
  const [txForm, setTxForm] = useState({ direction: "in" as "in" | "out", description: "", amount: 0, due_date: "", category: "", patient_id: "" });

  const revenue = txs.filter((t: any) => t.direction === "in" && t.status === "paid").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const expense = txs.filter((t: any) => t.direction === "out" && t.status === "paid").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const pending = txs.filter((t: any) => t.status === "pending").reduce((s: number, t: any) => s + Number(t.amount), 0);

  const mTx = useMutation({
    mutationFn: () => saveTx({ data: { ...txForm, patient_id: txForm.patient_id || undefined, due_date: txForm.due_date || undefined } }),
    onSuccess: () => { toast.success("Lançamento criado"); setTxForm({ direction: "in", description: "", amount: 0, due_date: "", category: "", patient_id: "" }); qc.invalidateQueries({ queryKey: ["ftxs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mAcc = useMutation({
    mutationFn: () => saveAcc({ data: accForm }),
    onSuccess: () => { toast.success("Conta criada"); setAccForm({ name: "", account_type: "bank", bank_name: "", balance: 0 }); qc.invalidateQueries({ queryKey: ["faccs"] }); },
  });
  const mPay = useMutation({ mutationFn: (id: string) => payTx({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["ftxs"] }) });

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Financeiro</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Fluxo de caixa</h1>
          <p className="mt-1.5 text-muted-foreground">Contas, lançamentos, recebimentos e repasse automático para profissionais.</p>
        </header>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat label="Receita realizada" value={revenue} tone="up" />
          <Stat label="Despesas pagas" value={expense} tone="down" />
          <Stat label="A receber" value={pending} tone="muted" />
        </div>
        <div className="mb-6 flex gap-2">
          {(["tx", "accounts", "splits", "wallets"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "border border-border"}`}>
              {t === "tx" ? "Lançamentos" : t === "accounts" ? "Contas" : t === "splits" ? "Repasses" : "Carteira de pacientes"}
            </button>
          ))}
        </div>

        {tab === "tx" && (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold">Novo lançamento</h2>
              <select value={txForm.direction} onChange={(e) => setTxForm({ ...txForm, direction: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="in">Entrada (receita)</option>
                <option value="out">Saída (despesa)</option>
              </select>
              <input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder="Descrição" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.01" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })} placeholder="Valor" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="date" value={txForm.due_date} onChange={(e) => setTxForm({ ...txForm, due_date: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <input value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} placeholder="Categoria" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={txForm.patient_id} onChange={(e) => setTxForm({ ...txForm, patient_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Sem paciente</option>
                {patients.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <button onClick={() => mTx.mutate()} disabled={!txForm.description || !txForm.amount} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Lançar</button>
            </section>
            <div className="space-y-2">
              {txs.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-center gap-3">
                    {t.direction === "in" ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-rose-500" />}
                    <div>
                      <p className="font-medium text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.due_date ?? "—"} · {t.category ?? "geral"} · {t.patients?.full_name ?? ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-semibold ${t.direction === "in" ? "text-emerald-600" : "text-rose-600"}`}>R$ {Number(t.amount).toFixed(2)}</p>
                    {t.status !== "paid" && <button onClick={() => mPay.mutate(t.id)} className="rounded-md border border-border px-2 py-1 text-xs"><CheckCircle2 className="h-3 w-3 inline" /> Baixar</button>}
                    {t.status === "paid" && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700">PAGO</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "accounts" && (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold">Nova conta</h2>
              <input value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} placeholder="Nome (ex: Caixa, Itaú PJ)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={accForm.account_type} onChange={(e) => setAccForm({ ...accForm, account_type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="bank">Banco</option><option value="cash">Caixa</option><option value="card">Cartão</option>
              </select>
              <input value={accForm.bank_name} onChange={(e) => setAccForm({ ...accForm, bank_name: e.target.value })} placeholder="Banco" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="0.01" value={accForm.balance} onChange={(e) => setAccForm({ ...accForm, balance: Number(e.target.value) })} placeholder="Saldo inicial" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={() => mAcc.mutate()} disabled={!accForm.name} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Criar</button>
            </section>
            <div className="space-y-2">
              {accounts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-primary" /><div><p className="font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.bank_name ?? a.account_type}</p></div></div>
                  <p className="font-semibold">R$ {Number(a.balance).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "splits" && <SplitsTab splits={splits} saveSp={saveSp} qc={qc} />}
        {tab === "wallets" && <WalletsTab />}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "up" | "down" | "muted" }) {
  const color = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>R$ {value.toFixed(2)}</p>
    </div>
  );
}

function SplitsTab({ splits, saveSp, qc }: any) {
  const [form, setForm] = useState({ professional_id: "", rule_type: "percentage" as "percentage" | "fixed", rule_value: 30 });
  const m = useMutation({ mutationFn: () => saveSp({ data: form }), onSuccess: () => { toast.success("Regra salva"); qc.invalidateQueries({ queryKey: ["splits"] }); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold">Regra de repasse</h2>
        <input value={form.professional_id} onChange={(e) => setForm({ ...form, professional_id: e.target.value })} placeholder="ID do profissional" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value as any })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="percentage">% sobre receita</option><option value="fixed">Valor fixo</option>
        </select>
        <input type="number" step="0.01" value={form.rule_value} onChange={(e) => setForm({ ...form, rule_value: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button onClick={() => m.mutate()} disabled={!form.professional_id} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Salvar</button>
      </section>
      <div className="space-y-2">
        {splits.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4">
            <div><p className="font-medium">{s.professionals?.full_name ?? "Profissional"}</p><p className="text-xs text-muted-foreground">{s.services?.name ?? "Todos os serviços"}</p></div>
            <p className="font-semibold">{s.rule_type === "percentage" ? `${s.rule_value}%` : `R$ ${Number(s.rule_value).toFixed(2)}`}</p>
          </div>
        ))}
        {splits.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra criada.</p>}
      </div>
    </div>
  );
}

function WalletsTab() {
  const balancesFn = useServerFn(listWalletBalances);
  const { data: balances = [] } = useQuery({ queryKey: ["wallet-balances"], queryFn: () => balancesFn() });
  const withCredit = balances.filter((b: any) => Number(b.balance) > 0);
  const withDebt = balances.filter((b: any) => Number(b.balance) < 0);
  const totalCredit = withCredit.reduce((s: number, b: any) => s + Number(b.balance), 0);
  const totalDebt = withDebt.reduce((s: number, b: any) => s + Number(b.balance), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface-elevated p-5">
        <div className="flex items-center gap-2 mb-2">
          <PiggyBank className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Carteira de pacientes</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Créditos disponibilizados a pacientes (ex: cancelamento de procedimento já pago). Esses valores ficam separados do faturamento e podem ser usados em consultas/procedimentos futuros.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total em créditos</p>
            <p className="text-xl font-semibold text-emerald-600">R$ {totalCredit.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-rose-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Valores em aberto</p>
            <p className="text-xl font-semibold text-rose-600">R$ {Math.abs(totalDebt).toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pacientes com saldo</p>
            <p className="text-xl font-semibold">{withCredit.length + withDebt.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface-elevated p-5">
          <h3 className="font-display text-base font-semibold mb-3 text-emerald-600">Pacientes com crédito</h3>
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {withCredit.map((b: any) => (
              <div key={b.patient_id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium">{b.full_name}</span>
                <span className="font-semibold text-emerald-600">R$ {Number(b.balance).toFixed(2)}</span>
              </div>
            ))}
            {withCredit.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum paciente com crédito.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-elevated p-5">
          <h3 className="font-display text-base font-semibold mb-3 text-rose-600">Pacientes com valores em aberto</h3>
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {withDebt.map((b: any) => (
              <div key={b.patient_id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium">{b.full_name}</span>
                <span className="font-semibold text-rose-600">R$ {Math.abs(Number(b.balance)).toFixed(2)}</span>
              </div>
            ))}
            {withDebt.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum valor em aberto.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
