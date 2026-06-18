import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Calendar, DollarSign, Star, FileDown, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getBiOverview } from "@/lib/wave6.functions";
import {
  getProfessionalPerformance,
  getCaptureFunnel,
  getRetentionCohort,
  getSimpleDre,
} from "@/lib/waveH.functions";

export const Route = createFileRoute("/_authenticated/bi")({ component: Page });

const fmt = (n: number) => `R$ ${Number(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function downloadCSV(name: string, rows: any[]) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(";"), ...rows.map(r => headers.map(h => esc(r[h])).join(";"))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

async function downloadPDF(title: string, sections: { heading: string; headers: string[]; rows: any[][] }[]) {
  const [{ default: jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = (autoTableMod as any).default ?? (autoTableMod as any);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(18); doc.text(title, 40, 50);
  doc.setFontSize(10); doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 40, 68);
  let y = 90;
  for (const s of sections) {
    doc.setFontSize(13); doc.setTextColor(20);
    doc.text(s.heading, 40, y); y += 8;
    autoTable(doc, {
      startY: y + 4,
      head: [s.headers],
      body: s.rows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 24;
    if (y > 760) { doc.addPage(); y = 50; }
  }
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

function Page() {
  const overviewFn = useServerFn(getBiOverview);
  const perfFn = useServerFn(getProfessionalPerformance);
  const funnelFn = useServerFn(getCaptureFunnel);
  const cohortFn = useServerFn(getRetentionCohort);
  const dreFn = useServerFn(getSimpleDre);

  const { data: overview } = useQuery({ queryKey: ["bi", "overview"], queryFn: () => overviewFn() });
  const { data: perf } = useQuery({ queryKey: ["bi", "perf"], queryFn: () => perfFn() });
  const { data: funnel } = useQuery({ queryKey: ["bi", "funnel"], queryFn: () => funnelFn() });
  const { data: cohort } = useQuery({ queryKey: ["bi", "cohort"], queryFn: () => cohortFn() });
  const { data: dre } = useQuery({ queryKey: ["bi", "dre"], queryFn: () => dreFn() });

  const exportPDF = () => downloadPDF("Relatório BI", [
    { heading: "Performance por profissional", headers: ["Profissional", "Especialidade", "Atend.", "Concluídas", "No-show %", "Receita", "Ticket", "NPS"],
      rows: (perf ?? []).map((p: any) => [p.name, p.specialty ?? "-", p.total, p.completed, `${p.noShowRate}%`, fmt(p.revenue), fmt(p.ticket), p.npsScore]) },
    { heading: "Funil de captação (90d)", headers: ["Etapa", "Total", "Conversão"],
      rows: funnel ? [
        ["Leads", funnel.leads, "—"],
        ["Agendados", funnel.scheduled, `${funnel.conversionLeadToSched}%`],
        ["Atendidos", funnel.attended, `${funnel.conversionSchedToAtt}%`],
        ["Recorrentes (2+)", funnel.recurring, `${funnel.conversionAttToRec}%`],
      ] : [] },
    { heading: "Cohort de retenção", headers: ["Mês", "Novos", "Voltaram em 30d", "60d", "90d"],
      rows: (cohort ?? []).map((c: any) => [c.month, c.size, `${c.r30}%`, `${c.r60}%`, `${c.r90}%`]) },
    { heading: "DRE simplificado", headers: ["Mês", "Receita", "Despesa", "Repasses", "Lucro"],
      rows: (dre ?? []).map((d: any) => [d.month, fmt(d.revenue), fmt(d.expense), fmt(d.payout), fmt(d.profit)]) },
  ]);

  return (
    <AppShell>
      <div className="container-page py-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Inteligência</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">BI avançado</h1>
            <p className="mt-1.5 text-muted-foreground">Performance, funil, cohort e DRE consolidados — exporte em CSV ou PDF.</p>
          </div>
          <Button onClick={exportPDF} className="gap-2"><FileText className="h-4 w-4" /> Exportar PDF</Button>
        </header>

        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card icon={Users} label="Pacientes ativos" value={overview?.patients ?? 0} />
          <Card icon={Calendar} label="Atendimentos 30d" value={overview?.appointments30d ?? 0} />
          <Card icon={TrendingUp} label="Receita 30d" value={fmt(overview?.revenue30d ?? 0)} />
          <Card icon={DollarSign} label="Despesa 30d" value={fmt(overview?.expense30d ?? 0)} />
          <Card icon={DollarSign} label="Lucro 30d" value={fmt(overview?.profit30d ?? 0)} tone={(overview?.profit30d ?? 0) >= 0 ? "up" : "down"} />
          <Card icon={Star} label="NPS" value={`${overview?.nps ?? 0} (${overview?.npsResponses ?? 0} resp.)`} />
        </div>

        {/* Performance por profissional */}
        <Section title="Performance por profissional (90d)" onExport={() => downloadCSV("performance-profissionais", perf ?? [])}>
          {!perf?.length ? <Empty msg="Sem profissionais cadastrados." /> : (
            <Table headers={["Profissional", "Atend.", "Concluídas", "No-show", "Receita", "Ticket médio", "NPS"]}>
              {perf.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color ?? "#94a3b8" }} />
                      <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.specialty ?? "—"}</div></div>
                    </div>
                  </td>
                  <td className="py-2 pr-3">{p.total}</td>
                  <td className="py-2 pr-3">{p.completed}</td>
                  <td className="py-2 pr-3"><span className={p.noShowRate > 15 ? "text-rose-600" : ""}>{p.noShowRate}%</span></td>
                  <td className="py-2 pr-3">{fmt(p.revenue)}</td>
                  <td className="py-2 pr-3">{fmt(p.ticket)}</td>
                  <td className="py-2 pr-3"><span className={p.npsScore >= 50 ? "text-emerald-600" : p.npsScore < 0 ? "text-rose-600" : ""}>{p.npsScore}</span></td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* Funil */}
        <Section title="Funil de captação (90d)" onExport={() => funnel && downloadCSV("funil-captacao", [funnel])}>
          {!funnel ? <Empty msg="Sem dados." /> : (
            <div className="grid grid-cols-4 gap-3">
              <Stage label="Leads" value={funnel.leads} pct={null} />
              <Stage label="Agendados" value={funnel.scheduled} pct={funnel.conversionLeadToSched} from="Leads" />
              <Stage label="Atendidos" value={funnel.attended} pct={funnel.conversionSchedToAtt} from="Agendados" />
              <Stage label="Recorrentes" value={funnel.recurring} pct={funnel.conversionAttToRec} from="Atendidos" />
            </div>
          )}
        </Section>

        {/* Cohort */}
        <Section title="Cohort de retenção (6 meses)" onExport={() => downloadCSV("cohort-retencao", cohort ?? [])}>
          {!cohort?.length ? <Empty msg="Sem cohorts ainda — registre consultas para gerar a curva." /> : (
            <Table headers={["Mês de entrada", "Novos pacientes", "Voltaram 30d", "60d", "90d"]}>
              {cohort.map((c: any) => (
                <tr key={c.month} className="border-t border-border">
                  <td className="py-2 pr-3 font-medium">{c.month}</td>
                  <td className="py-2 pr-3">{c.size}</td>
                  <td className="py-2 pr-3"><Bar pct={c.r30} /></td>
                  <td className="py-2 pr-3"><Bar pct={c.r60} /></td>
                  <td className="py-2 pr-3"><Bar pct={c.r90} /></td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* DRE */}
        <Section title="DRE simplificado (6 meses)" onExport={() => downloadCSV("dre-simplificado", dre ?? [])}>
          {!dre?.length ? <Empty msg="Sem lançamentos financeiros no período." /> : (
            <Table headers={["Mês", "Receita", "Despesa", "Repasses", "Lucro"]}>
              {dre.map((d: any) => (
                <tr key={d.month} className="border-t border-border">
                  <td className="py-2 pr-3 font-medium">{d.month}</td>
                  <td className="py-2 pr-3">{fmt(d.revenue)}</td>
                  <td className="py-2 pr-3 text-rose-600">{fmt(d.expense)}</td>
                  <td className="py-2 pr-3 text-amber-600">{fmt(d.payout)}</td>
                  <td className={`py-2 pr-3 font-semibold ${d.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(d.profit)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </div>
    </AppShell>
  );
}

function Card({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><p className="text-xs uppercase tracking-wider">{label}</p></div>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Section({ title, onExport, children }: { title: string; onExport?: () => void; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {onExport && <Button size="sm" variant="outline" onClick={onExport} className="gap-2"><FileDown className="h-4 w-4" /> CSV</Button>}
      </div>
      {children}
    </section>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          {headers.map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
        </tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{msg}</p>;
}

function Stage({ label, value, pct, from }: { label: string; value: number; pct: number | null; from?: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {pct !== null && <p className="mt-1 text-xs text-muted-foreground">{pct}% vindos de {from}</p>}
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs tabular-nums">{pct}%</span>
    </div>
  );
}
