import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  listExportableTables, exportTable, exportAll,
  aiNormalizeCsv, importRows, importableTables,
} from "@/lib/dataio.functions";
import { Download, Upload, Sparkles, FileJson, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dados")({
  component: DataIOPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function download(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function DataIOPage() {
  const listFn = useServerFn(listExportableTables);
  const exportFn = useServerFn(exportTable);
  const exportAllFn = useServerFn(exportAll);

  const tables = useQuery({ queryKey: ["dataio-tables"], queryFn: () => listFn() });

  const exportOne = useMutation({
    mutationFn: (v: { table: string; format: "csv" | "json" }) => exportFn({ data: v }),
    onSuccess: (r) => {
      download(r.filename, r.content, r.filename.endsWith(".json") ? "application/json" : "text/csv");
      toast.success(`${r.count} registros exportados`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportAllMut = useMutation({
    mutationFn: () => exportAllFn(),
    onSuccess: (r) => { download(r.filename, r.content, "application/json"); toast.success("Backup LGPD baixado"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container-page py-8 space-y-6">
        <PageHeader
          eyebrow="Dados"
          title="Importar & Exportar"
          description="Portabilidade total (LGPD): baixe seus dados a qualquer momento. Importe com ajuda da IA."
          className="mb-2"
        />


        <Tabs defaultValue="export">
          <TabsList>
            <TabsTrigger value="export"><Download className="mr-2 h-4 w-4" />Exportar</TabsTrigger>
            <TabsTrigger value="import"><Upload className="mr-2 h-4 w-4" />Importar</TabsTrigger>
            <TabsTrigger value="manual"><BookOpen className="mr-2 h-4 w-4" />Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium flex items-center gap-2"><FileJson className="h-4 w-4" />Backup completo (LGPD)</h2>
                  <p className="text-xs text-muted-foreground">Todas as tabelas em um único JSON.</p>
                </div>
                <Button onClick={() => exportAllMut.mutate()} disabled={exportAllMut.isPending}>
                  {exportAllMut.isPending ? "Gerando..." : "Baixar tudo"}
                </Button>
              </div>
            </Card>

            <Card className="divide-y">
              {tables.isLoading && <div className="p-4 text-sm text-muted-foreground">Carregando...</div>}
              {tables.data?.filter((t) => t.count > 0).map((t) => (
                <div key={t.table} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{t.table}</span>
                    <Badge variant="secondary">{t.count}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => exportOne.mutate({ table: t.table, format: "csv" })}>CSV</Button>
                    <Button size="sm" variant="outline" onClick={() => exportOne.mutate({ table: t.table, format: "json" })}>JSON</Button>
                  </div>
                </div>
              ))}
              {tables.data && !tables.data.some((t) => t.count > 0) && (
                <div className="p-4 text-sm text-muted-foreground">Nenhum dado para exportar ainda.</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <ImportTab />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card className="p-5 prose prose-sm max-w-none">
              <h3>Como organizar antes de importar</h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Use uma planilha com cabeçalho na primeira linha.</li>
                <li>Salve como CSV (UTF-8). Separador vírgula ou ponto-e-vírgula.</li>
                <li>Datas no formato AAAA-MM-DD. Telefones com DDD.</li>
                <li>Campos vazios podem ficar em branco — não use "N/A".</li>
                <li>Se as colunas estiverem com nomes diferentes do nosso schema, a IA tenta mapear.</li>
              </ol>
              <h3 className="mt-4">Campos esperados por tabela</h3>
              <FieldsReference />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function FieldsReference() {
  const fn = useServerFn(importableTables);
  const q = useQuery({ queryKey: ["dataio-importable"], queryFn: () => fn() });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {q.data?.map((t) => (
        <div key={t.table} className="rounded border p-2">
          <div className="font-mono text-xs font-semibold">{t.table}</div>
          <div className="text-[11px] text-muted-foreground">{t.fields.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}

function ImportTab() {
  const importsFn = useServerFn(importableTables);
  const normalizeFn = useServerFn(aiNormalizeCsv);
  const importFn = useServerFn(importRows);
  const importable = useQuery({ queryKey: ["dataio-importable"], queryFn: () => importsFn() });
  const [table, setTable] = useState<string>("patients");
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<any>(null);

  const normalize = useMutation({
    mutationFn: () => normalizeFn({ data: { table, csv } }),
    onSuccess: (r) => { setResult(r); toast.success(`${r.total} linhas analisadas`); },
    onError: (e: any) => toast.error(e.message),
  });

  const doImport = useMutation({
    mutationFn: () => importFn({ data: { table, rows: result.normalized } }),
    onSuccess: (r) => { toast.success(`${r.inserted} registros importados`); setResult(null); setCsv(""); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="text-xs text-muted-foreground">Tabela alvo</label>
            <Select value={table} onValueChange={setTable}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {importable.data?.map((t) => <SelectItem key={t.table} value={t.table}>{t.table}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <input
              type="file"
              accept=".csv,text/csv"
              className="text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setCsv(String(r.result ?? ""));
                r.readAsText(f);
              }}
            />
          </div>
        </div>
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="Cole o CSV aqui ou selecione um arquivo acima"
          className="font-mono text-xs h-40"
        />
        <Button onClick={() => normalize.mutate()} disabled={!csv || normalize.isPending}>
          <Sparkles className="mr-2 h-4 w-4" />
          {normalize.isPending ? "IA analisando..." : "Normalizar com IA"}
        </Button>
      </Card>

      {result && (
        <Card className="p-4 space-y-3">
          <div>
            <h3 className="font-medium">Mapeamento sugerido</h3>
            <p className="text-xs text-muted-foreground">{result.notes}</p>
          </div>
          <div className="grid gap-1 text-xs">
            {Object.entries(result.mapping).map(([src, dest]: any) => (
              <div key={src} className="flex justify-between border-b py-1">
                <span className="font-mono">{src}</span>
                <span className={dest ? "text-emerald-600" : "text-muted-foreground"}>{dest ?? "— ignorado"}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Pré-visualização (10 linhas)</h4>
            <pre className="bg-muted rounded p-2 overflow-x-auto text-[11px]">{JSON.stringify(result.preview, null, 2)}</pre>
          </div>
          <Button onClick={() => doImport.mutate()} disabled={doImport.isPending}>
            {doImport.isPending ? "Importando..." : `Importar ${result.normalized.length} registros`}
          </Button>
        </Card>
      )}
    </div>
  );
}
