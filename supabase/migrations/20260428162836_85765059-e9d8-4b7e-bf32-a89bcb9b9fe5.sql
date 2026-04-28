
-- =========================================
-- PROFILES + TENANT
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT gen_random_uuid(),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- TIMESTAMP TRIGGER FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- HELPER: get current tenant
-- =========================================
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =========================================
-- JARVIS_COMMANDS
-- =========================================
CREATE TABLE public.jarvis_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  detected_intent TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  response_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jarvis_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own commands" ON public.jarvis_commands
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own commands" ON public.jarvis_commands
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = public.current_tenant_id());
CREATE POLICY "Users update own commands" ON public.jarvis_commands
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own commands" ON public.jarvis_commands
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER jarvis_commands_updated_at
  BEFORE UPDATE ON public.jarvis_commands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_commands_user_created ON public.jarvis_commands(user_id, created_at DESC);

-- =========================================
-- JARVIS_ACTIONS
-- =========================================
CREATE TABLE public.jarvis_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID REFERENCES public.jarvis_commands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_system TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);

ALTER TABLE public.jarvis_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own actions" ON public.jarvis_actions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own actions" ON public.jarvis_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = public.current_tenant_id());
CREATE POLICY "Users update own actions" ON public.jarvis_actions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own actions" ON public.jarvis_actions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_actions_command ON public.jarvis_actions(command_id);
CREATE INDEX idx_actions_user_created ON public.jarvis_actions(user_id, created_at DESC);

-- =========================================
-- JARVIS_MEMORY
-- =========================================
CREATE TABLE public.jarvis_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jarvis_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own memory" ON public.jarvis_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memory" ON public.jarvis_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = public.current_tenant_id());
CREATE POLICY "Users update own memory" ON public.jarvis_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own memory" ON public.jarvis_memory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER jarvis_memory_updated_at
  BEFORE UPDATE ON public.jarvis_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_memory_user_active ON public.jarvis_memory(user_id, is_active);

-- =========================================
-- CONNECTED_SYSTEMS
-- =========================================
CREATE TABLE public.connected_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  system_type TEXT NOT NULL,
  api_base_url TEXT,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.connected_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own systems" ON public.connected_systems
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own systems" ON public.connected_systems
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = public.current_tenant_id());
CREATE POLICY "Users update own systems" ON public.connected_systems
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own systems" ON public.connected_systems
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER connected_systems_updated_at
  BEFORE UPDATE ON public.connected_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
