import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { listPayroll, savePayroll, deletePayroll } from "@/lib/wave5b.functions";

export const Route = createFileRoute("/_authenticated/folha")({ component: FolhaPage });

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FolhaPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPayroll);
  const save = useServerFn(savePayroll);
  const del = useServerFn(deletePayroll);
  const { data: rows = [] } = useQuery({ queryKey: ["payroll"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 7) + "-01";
  const [form, setForm] = useState({
    reference_month: today, full_name: "", role_label: "", base_salary: 0, pro_labore: 0, bonus: 0,
    inss: 0, fgts: 0, irrf: 0, other_deductions: 0, status: "draft" as const, notes: "",
  });

  const liquido = form.base_salary + form.pro_labore + form.bonus - form.inss - form.irrf - form.other_deductions;
  const saveMut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => { toast.success("Folha salva"); qc.invalidateQueries({ queryKey: ["payroll"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["payroll"] }); },
  });

  const totalMonth = rows
    .filter((r: any) => r.reference_month === today)
    .reduce((acc: number, r: any) => acc + Number(r.net_amount), 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Folha de pagamento</h1>
            <p className="text-sm text-muted-foreground">Cadastre salários, pró-labore, encargos e calcule o líquido automaticamente.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova folha</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Lançamento de folha</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div><Label>Mês de referência</Label><Input type="date" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="approved">Aprovada</SelectItem>
                      <SelectItem value="paid">Paga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Nome do colaborador</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Cargo</Label><Input value={form.role_label} onChange={(e) => setForm({ ...form, role_label: e.target.value })} /></div>
                {([
                  ["base_salary", "Salário base"], ["pro_labore", "Pró-labore"], ["bonus", "Bônus"],
                  ["inss", "INSS"], ["fgts", "FGTS"], ["irrf", "IRRF"], ["other_deductions", "Outros descontos"],
                ] as const).map(([k, label]) => (
                  <div key={k}><Label>{label} (R$)</Label>
                    <Input type="number" step="0.01" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} />
                  </div>
                ))}
                <div className="md:col-span-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  Líquido a pagar: <span className="font-semibold tabular-nums">{brl(liquido)}</span>
                </div>
              </div>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Salvar</Button>
            </DialogContent>
          </Dialog>
        </header>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs text-muted-foreground">Total líquido do mês atual</p>
              <p className="text-2xl font-semibold tabular-nums">{brl(totalMonth)}</p>
            </div>
            <Badge variant="outline">{rows.length} lançamentos</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <div className="font-medium">{r.full_name} <span className="text-xs text-muted-foreground">· {r.role_label ?? "-"}</span></div>
                      <div className="text-xs text-muted-foreground">Ref. {r.reference_month?.slice(0, 7)} · {r.status}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-semibold">{brl(Number(r.net_amount))}</span>
                      <Button size="icon" variant="ghost" onClick={() => delMut.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
