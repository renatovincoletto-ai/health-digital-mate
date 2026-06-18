import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getDre } from "@/lib/wave5b.functions";

export const Route = createFileRoute("/_authenticated/dre")({ component: DrePage });

function brl(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function DrePage() {
  const [months, setMonths] = useState(6);
  const dre = useServerFn(getDre);
  const { data } = useQuery({ queryKey: ["dre", months], queryFn: () => dre({ data: { months } }) });
  const buckets = data?.buckets ?? [];
  const totals = data?.totals ?? { income: 0, expense: 0, net: 0 };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">DRE — Demonstrativo de Resultados</h1>
            <p className="text-sm text-muted-foreground">Apuração mensal com receitas, despesas e resultado líquido por categoria.</p>
          </div>
          <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi title="Receitas" value={brl(totals.income)} icon={TrendingUp} tone="emerald" />
          <Kpi title="Despesas" value={brl(totals.expense)} icon={TrendingDown} tone="rose" />
          <Kpi title="Resultado" value={brl(totals.net)} icon={Wallet} tone={totals.net >= 0 ? "emerald" : "rose"} />
        </div>

        <div className="space-y-3">
          {buckets.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
              Sem movimentações registradas no período.
            </CardContent></Card>
          )}
          {buckets.map((b) => (
            <Card key={b.month}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{b.month}</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">+ {brl(b.income)}</Badge>
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-700">− {brl(b.expense)}</Badge>
                  <Badge variant={b.net >= 0 ? "default" : "destructive"}>= {brl(b.net)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                  {Object.entries(b.byCategory).sort((a, c) => Math.abs(c[1]) - Math.abs(a[1])).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className={cat.startsWith("+") ? "text-emerald-700 tabular-nums" : "text-rose-700 tabular-nums"}>
                        {brl(Number(val))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ title, value, icon: Icon, tone }: { title: string; value: string; icon: any; tone: "emerald" | "rose" }) {
  const cls = tone === "emerald" ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
