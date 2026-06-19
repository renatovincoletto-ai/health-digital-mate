import { createFileRoute } from "@tanstack/react-router";
import { Calculator, FileText, Receipt, Banknote } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/simple-page";

export const Route = createFileRoute("/_authenticated/contador")({ component: Page });

const links = [
  { to: "/fiscal", icon: FileText, title: "Notas fiscais (NFS-e)", desc: "Emita NFS-e com ISS automático e armazene PDF/XML." },
  { to: "/tributos", icon: Receipt, title: "Tributos & DAS", desc: "Controle de DAS, IRPJ, ISS, INSS e demais obrigações." },
  { to: "/repasses", icon: Banknote, title: "Repasses", desc: "Fechamento de comissões e pagamentos a profissionais." },
];

function Page() {
  return (
    <SimplePage onboardingSection="contador" title="Contábil" description="Painel para sua rotina contábil. Mantenha CNPJ, impostos e notas fiscais em dia — compartilhe documentos com seu contador.">
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="group rounded-2xl border border-border bg-surface-elevated p-6 hover:border-primary transition">
            <l.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{l.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
        <Calculator className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-3 font-medium">Quer contabilidade 100% feita pra você?</p>
        <p className="mt-1 text-sm text-muted-foreground">Conecte um contador parceiro ou ative o pacote Minha Clínica Contábil para emissão de notas, apuração de impostos, declarações e suporte fiscal.</p>
        <a href="/precos" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ver pacote Contábil</a>
      </div>
    </SimplePage>
  );
}
