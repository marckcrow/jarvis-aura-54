create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id(),
  user_id uuid not null default auth.uid(),
  name text not null,
  description text,
  goals text,
  status text not null default 'active',
  progress int not null default 0,
  deadline date,
  source_action_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "Users view own projects" on public.projects for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own projects" on public.projects for insert to authenticated with check (auth.uid() = user_id and tenant_id = public.current_tenant_id());
create policy "Users update own projects" on public.projects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own projects" on public.projects for delete to authenticated using (auth.uid() = user_id);
create trigger projects_updated_at before update on public.projects for each row execute function public.update_updated_at_column();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id(),
  user_id uuid not null default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'media',
  due_at timestamptz,
  done boolean not null default false,
  source_action_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "Users view own tasks" on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own tasks" on public.tasks for insert to authenticated with check (auth.uid() = user_id and tenant_id = public.current_tenant_id());
create policy "Users update own tasks" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own tasks" on public.tasks for delete to authenticated using (auth.uid() = user_id);
create trigger tasks_updated_at before update on public.tasks for each row execute function public.update_updated_at_column();