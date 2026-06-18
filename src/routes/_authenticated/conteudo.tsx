import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  Sparkles, Image as ImageIcon, Plus, Loader2, Trash2, Wand2, Lightbulb,
  Calendar as CalIcon, Palette, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getBrand, saveBrand,
  listPosts, savePost, deletePost,
  generateCaption, generatePostImage,
  listContentIdeas, generateContentIdeas,
} from "@/lib/content.functions";
import { supabase } from "@/integrations/supabase/client";
import { getMyTenant } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/conteudo")({
  component: ContentPage,
});

function ContentPage() {
  return (
    <AppShell>
      <div className="container-page py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Conteúdo</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Conteúdo & redes sociais
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Brand kit, gerador de peças e biblioteca de posts agendados.
          </p>
        </div>
        <Tabs defaultValue="posts">
          <TabsList className="mb-6">
            <TabsTrigger value="posts"><ImageIcon className="mr-2 h-4 w-4" />Posts</TabsTrigger>
            <TabsTrigger value="ideas"><Lightbulb className="mr-2 h-4 w-4" />Ideias</TabsTrigger>
            <TabsTrigger value="brand"><Palette className="mr-2 h-4 w-4" />Brand kit</TabsTrigger>
          </TabsList>
          <TabsContent value="posts"><PostsTab /></TabsContent>
          <TabsContent value="ideas"><IdeasTab /></TabsContent>
          <TabsContent value="brand"><BrandTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ============= POSTS =============
function PostsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPosts);
  const saveFn = useServerFn(savePost);
  const delFn = useServerFn(deletePost);
  const capFn = useServerFn(generateCaption);
  const imgFn = useServerFn(generatePostImage);
  const { data: posts = [] } = useQuery({ queryKey: ["posts"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [genImg, setGenImg] = useState(false);
  const [genCap, setGenCap] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ caption: "", platforms: ["instagram"], status: "draft" });
    setOpen(true);
  }
  function openEdit(p: any) {
    setEditing(p);
    setForm({
      ...p,
      scheduled_for: p.scheduled_for ? new Date(p.scheduled_for).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: (d: any) => saveFn({
      data: { ...d, scheduled_for: d.scheduled_for ? new Date(d.scheduled_for).toISOString() : null },
    }),
    onSuccess: () => {
      toast.success("Post salvo");
      qc.invalidateQueries({ queryKey: ["posts"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  async function generateImageNow() {
    if (!form.caption?.trim() && !form.title?.trim()) {
      toast.error("Escreva um título ou legenda primeiro");
      return;
    }
    setGenImg(true);
    try {
      const r = await imgFn({ data: { prompt: form.title || form.caption.slice(0, 300) } });
      setForm({ ...form, image_url: r.image_url });
      toast.success("Imagem gerada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenImg(false);
    }
  }
  async function generateCaptionNow() {
    if (!form.title?.trim()) {
      toast.error("Escreva um tópico no campo Título");
      return;
    }
    setGenCap(true);
    try {
      const r = await capFn({ data: { topic: form.title, platform: form.platforms?.[0] ?? "instagram" } });
      setForm({ ...form, caption: r.caption });
      toast.success("Legenda gerada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenCap(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo post</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Nenhum post ainda. Crie o primeiro!</p>
        )}
        {posts.map((p: any) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {p.image_url ? (
              <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
            <div className="p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <PostStatusBadge status={p.status} />
                <div className="flex gap-1">
                  {p.platforms?.map((pl: string) => (
                    <Badge key={pl} variant="outline" className="text-[10px] uppercase">{pl}</Badge>
                  ))}
                </div>
              </div>
              <p className="line-clamp-2 text-sm font-medium">{p.title || p.caption.slice(0, 80)}</p>
              {p.scheduled_for && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <CalIcon className="mr-1 inline h-3 w-3" />
                  {new Date(p.scheduled_for).toLocaleString("pt-BR")}
                </p>
              )}
              <div className="mt-2 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                <Button variant="ghost" size="icon" onClick={() => confirm("Excluir?") && remove.mutate(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} post</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label>Título / tópico</Label>
                <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex: Como prevenir a cárie em crianças" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Legenda</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={generateCaptionNow} disabled={genCap}>
                    {genCap ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                    IA
                  </Button>
                </div>
                <Textarea rows={6} value={form.caption ?? ""} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
              </div>
              <div>
                <Label>Plataformas</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(["instagram", "facebook", "linkedin"] as const).map((pl) => {
                    const on = form.platforms?.includes(pl);
                    return (
                      <button
                        key={pl}
                        type="button"
                        onClick={() => {
                          const next = on
                            ? form.platforms.filter((x: string) => x !== pl)
                            : [...(form.platforms ?? []), pl];
                          setForm({ ...form, platforms: next.length ? next : ["instagram"] });
                        }}
                        className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
                          on ? "border-primary bg-primary/10 text-primary" : "border-border"
                        }`}
                      >{pl}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Agendar para</Label>
                <Input type="datetime-local" value={form.scheduled_for ?? ""}
                  onChange={(e) => setForm({
                    ...form,
                    scheduled_for: e.target.value,
                    status: e.target.value ? "scheduled" : "draft",
                  })} />
              </div>
            </div>
            <div>
              <Label>Imagem</Label>
              <div className="relative mt-1 aspect-square overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                {genImg && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
              <Button type="button" className="mt-2 w-full" variant="outline" onClick={generateImageNow} disabled={genImg}>
                <Wand2 className="mr-2 h-4 w-4" /> Gerar imagem com IA
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-blue-500/10 text-blue-600",
    published: "bg-emerald-500/10 text-emerald-600",
    failed: "bg-red-500/10 text-red-600",
  };
  const labels: Record<string, string> = {
    draft: "rascunho", scheduled: "agendado", published: "publicado", failed: "falha",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${map[status]}`}>{labels[status]}</span>;
}

// ============= IDEAS =============
function IdeasTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listContentIdeas);
  const genFn = useServerFn(generateContentIdeas);
  const { data = [] } = useQuery({ queryKey: ["ideas"], queryFn: () => listFn() });
  const gen = useMutation({
    mutationFn: () => genFn(),
    onSuccess: () => {
      toast.success("Ideias geradas");
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Banco de ideias gerado pela IA com base no seu consultório.</p>
        <Button onClick={() => gen.mutate()} disabled={gen.isPending}>
          {gen.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gerar 8 ideias
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Nenhuma ideia ainda. Clique acima para gerar.</p>
        )}
        {data.map((i: any) => (
          <div key={i.id} className="rounded-xl border border-border bg-surface-elevated p-4">
            <Badge variant="outline" className="mb-2 text-[10px] uppercase">{i.category}</Badge>
            <p className="font-medium">{i.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= BRAND =============
function BrandTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getBrand);
  const saveFn = useServerFn(saveBrand);
  const tenantFn = useServerFn(getMyTenant);
  const { data, isLoading } = useQuery({ queryKey: ["brand"], queryFn: () => getFn() });
  const { data: tenant } = useQuery({ queryKey: ["my-tenant"], queryFn: () => tenantFn() });
  const [form, setForm] = useState<any>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data && Object.keys(form).length === 0) {
      setForm({
        logo_url: data.logo_url ?? "",
        primary_color: data.primary_color ?? "#3B82F6",
        secondary_color: data.secondary_color ?? "#10B981",
        accent_color: data.accent_color ?? "#F59E0B",
        font_heading: data.font_heading ?? "",
        font_body: data.font_body ?? "",
        tone_of_voice: data.tone_of_voice ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("Brand kit salvo");
      qc.invalidateQueries({ queryKey: ["brand"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function uploadLogo(file: File) {
    if (!tenant?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${tenant.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-assets")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(path);
      setForm({ ...form, logo_url: pub.publicUrl });
      toast.success("Logo enviada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {form.logo_url ? (
              <img src={form.logo_url} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Enviar logo
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">PNG ou SVG, máx 2 MB</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Cores</h3>
        <div className="grid grid-cols-3 gap-3">
          {(["primary_color", "secondary_color", "accent_color"] as const).map((k, i) => (
            <div key={k}>
              <Label>{["Primária", "Secundária", "Destaque"][i]}</Label>
              <div className="mt-1 flex gap-2">
                <Input type="color" className="h-10 w-14 p-1" value={form[k] ?? "#000000"}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                <Input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Tipografia</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fonte de títulos</Label>
            <Input value={form.font_heading ?? ""} onChange={(e) => setForm({ ...form, font_heading: e.target.value })}
              placeholder="ex: Playfair Display" />
          </div>
          <div>
            <Label>Fonte de corpo</Label>
            <Input value={form.font_body ?? ""} onChange={(e) => setForm({ ...form, font_body: e.target.value })}
              placeholder="ex: Inter" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Tom de voz</h3>
        <Textarea rows={4} value={form.tone_of_voice ?? ""}
          onChange={(e) => setForm({ ...form, tone_of_voice: e.target.value })}
          placeholder="Como você quer soar ao paciente? Ex: acolhedor, científico, próximo, formal..." />
        <p className="mt-2 text-xs text-muted-foreground">
          A IA usa isso ao escrever legendas, posts e copies de anúncio.
        </p>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg">
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar brand kit
      </Button>
    </div>
  );
}
