
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'admin');
CREATE TYPE public.tenant_type AS ENUM ('medico', 'dentista', 'clinica', 'outro');
CREATE TYPE public.onboarding_status AS ENUM ('pending', 'site_pending', 'completed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: usuario le e edita o proprio" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ TENANTS ============
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.tenant_type NOT NULL DEFAULT 'medico',
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  specialty TEXT,
  council_type TEXT, -- CRM, CRO, etc.
  council_number TEXT,
  council_state TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  onboarding_status public.onboarding_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO anon; -- leitura pública por slug para o site público
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles: usuario ve os proprios" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ============ has_role (security definer, evita recursao) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Tenants policies
CREATE POLICY "Tenants: dono le" ON public.tenants
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Tenants: leitura publica" ON public.tenants
  FOR SELECT TO anon USING (onboarding_status = 'completed');
CREATE POLICY "Tenants: dono cria" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tenants: dono atualiza" ON public.tenants
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Tenants: dono deleta" ON public.tenants
  FOR DELETE USING (auth.uid() = owner_id);

-- ============ SITES ============
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sites_tenant ON public.sites(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT SELECT ON public.sites TO anon;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sites: dono do tenant gerencia" ON public.sites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid())
  );
CREATE POLICY "Sites: leitura publica quando publicado" ON public.sites
  FOR SELECT TO anon USING (published = true);

-- ============ SITE MESSAGES (chat do assistente) ============
CREATE TABLE public.site_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_site_messages_site ON public.site_messages(site_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_messages TO authenticated;
GRANT ALL ON public.site_messages TO service_role;
ALTER TABLE public.site_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site messages: dono do tenant gerencia" ON public.site_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sites s
      JOIN public.tenants t ON t.id = s.tenant_id
      WHERE s.id = site_id AND t.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites s
      JOIN public.tenants t ON t.id = s.tenant_id
      WHERE s.id = site_id AND t.owner_id = auth.uid()
    )
  );

-- ============ BRANDS ============
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0d7a6b',
  secondary_color TEXT DEFAULT '#f7f5ef',
  accent_color TEXT DEFAULT '#d4a574',
  font_heading TEXT DEFAULT 'Fraunces',
  font_body TEXT DEFAULT 'Inter',
  tone_of_voice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brands: dono gerencia" ON public.brands
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid())
  );

-- ============ TRIGGER updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sites_updated BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TRIGGER cria profile automaticamente ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
