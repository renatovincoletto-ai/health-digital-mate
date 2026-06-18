import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Phone, MessageCircle, Mail, MapPin, ChevronDown } from "lucide-react";
import { getPublicSite } from "@/lib/site.functions";
import type { SiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/s/$slug")({
  head: ({ loaderData }) => {
    const data = loaderData as { tenant?: { display_name: string; city?: string | null; specialty?: string | null }; site?: { seo_title?: string | null; seo_description?: string | null } } | undefined;
    const title = data?.site?.seo_title || data?.tenant?.display_name || "Consultório";
    const desc = data?.site?.seo_description || "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:type", content: "website" },
      ],
    };
  },
  loader: async ({ params }) => {
    const { getPublicSite } = await import("@/lib/site.functions");
    const result = await getPublicSite({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  component: PublicSite,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-5xl font-semibold">Site não encontrado</h1>
        <p className="mt-3 text-muted-foreground">
          Este consultório ainda não publicou o site.
        </p>
        <Link to="/" className="mt-6 inline-block text-primary hover:underline">
          ← Voltar
        </Link>
      </div>
    </div>
  ),
});

function PublicSite() {
  const params = Route.useParams();
  const fetchSite = useServerFn(getPublicSite);
  const { data } = useQuery({
    queryKey: ["public-site", params.slug],
    queryFn: () => fetchSite({ data: { slug: params.slug } }),
    initialData: Route.useLoaderData(),
  });

  if (!data) return null;
  const { tenant, site } = data;
  const content = site.content as SiteContent;

  const whatsappLink = tenant.whatsapp
    ? `https://wa.me/55${tenant.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD para SEO local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": tenant.type === "dentista" ? "Dentist" : "MedicalBusiness",
            name: tenant.display_name,
            medicalSpecialty: tenant.specialty,
            address: {
              "@type": "PostalAddress",
              addressLocality: tenant.city,
              addressRegion: tenant.state,
              addressCountry: "BR",
            },
            telephone: tenant.phone,
            email: tenant.email,
          }),
        }}
      />

      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <p className="font-display text-lg font-semibold tracking-tight">
            {tenant.display_name}
          </p>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" /> {content.hero.primaryCta}
            </a>
          )}
        </div>
      </header>

      <section className="bg-hero-gradient">
        <div className="container-page py-20 md:py-28">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {tenant.specialty}
              {tenant.city ? ` · ${tenant.city}${tenant.state ? `/${tenant.state}` : ""}` : ""}
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              {content.hero.headline}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {content.hero.subheadline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> {content.hero.primaryCta}
                </a>
              )}
              {content.hero.secondaryCta && (
                <a
                  href="#sobre"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-3 text-base font-medium hover:bg-accent/10"
                >
                  {content.hero.secondaryCta}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="border-t border-border/60 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {content.about.title}
            </h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
              {content.about.body}
            </p>
          </div>
        </div>
      </section>

      {content.services.length > 0 && (
        <section className="bg-surface py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Serviços
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {content.services.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-surface-elevated p-7 transition hover:shadow-lift"
                >
                  <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.differentiators.length > 0 && (
        <section className="py-20">
          <div className="container-page">
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
              {content.differentiators.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-5xl font-semibold text-primary/20">
                    0{i + 1}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.faq.length > 0 && (
        <section className="bg-surface py-20">
          <div className="container-page max-w-3xl">
            <h2 className="mb-10 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Perguntas frequentes
            </h2>
            <div className="space-y-3">
              {content.faq.map((q, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-border bg-surface-elevated p-5"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium">
                    {q.question}
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {q.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl rounded-3xl bg-cta-gradient p-10 text-primary-foreground md:p-14">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Vamos conversar?
            </h2>
            <p className="mt-3 opacity-85">
              Entre em contato pelo canal mais conveniente para você.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-base font-medium text-accent-foreground hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-5 py-3 text-base font-medium hover:bg-primary-foreground/10"
                >
                  <Phone className="h-4 w-4" /> {tenant.phone}
                </a>
              )}
              {tenant.email && (
                <a
                  href={`mailto:${tenant.email}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-5 py-3 text-base font-medium hover:bg-primary-foreground/10"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
              )}
            </div>
            {(content.location.address || content.location.city) && (
              <p className="mt-7 flex items-center gap-2 text-sm opacity-85">
                <MapPin className="h-4 w-4" />
                {[content.location.address, content.location.neighborhood, content.location.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-8">
        <div className="container-page text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {tenant.display_name}
            {tenant.council_type && tenant.council_number && (
              <>
                {" "}· {tenant.council_type} {tenant.council_number}
                {tenant.council_state && `/${tenant.council_state}`}
              </>
            )}
          </p>
          <p className="mt-1">
            <Link to="/" className="hover:text-foreground">
              Site feito com SaúdeOS
            </Link>
          </p>
        </div>
      </footer>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground shadow-lift transition hover:scale-105"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
