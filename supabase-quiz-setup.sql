-- Run in Supabase SQL Editor. Add an Auth user's UUID to quiz_admins manually.
create extension if not exists pgcrypto;
create table if not exists public.quiz_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz default now());
create table if not exists public.quiz_teams(id uuid primary key default gen_random_uuid(),name text not null unique check(length(trim(name)) between 1 and 80),active boolean not null default true,sort_order int not null default 0,created_at timestamptz default now());
create table if not exists public.quiz_rounds(id uuid primary key default gen_random_uuid(),name text not null unique check(length(trim(name)) between 1 and 80),active boolean not null default true,sort_order int not null default 0,created_at timestamptz default now());
create table if not exists public.quiz_scores(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.quiz_teams(id),round_id uuid not null references public.quiz_rounds(id),points numeric(10,2) not null check(points>=0),updated_at timestamptz not null default now(),updated_by uuid references auth.users(id),unique(team_id,round_id));
create table if not exists public.quiz_score_history(id bigint generated always as identity primary key,team_id uuid not null,round_id uuid not null,old_points numeric(10,2),new_points numeric(10,2) not null,changed_by uuid,changed_at timestamptz default now());
create table if not exists public.quiz_settings(id int primary key check(id=1),title text not null default 'Group Quiz Competition',status text not null default 'upcoming' check(status in('upcoming','live','paused','completed')),updated_at timestamptz default now());
insert into public.quiz_settings(id) values(1) on conflict(id) do nothing;
create or replace function public.quiz_is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.quiz_admins where user_id=auth.uid()); $$;
create or replace function public.quiz_audit_score() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.quiz_score_history(team_id,round_id,old_points,new_points,changed_by) values(new.team_id,new.round_id,case when tg_op='UPDATE' then old.points else null end,new.points,auth.uid());new.updated_by=auth.uid();new.updated_at=now();return new;end; $$;
drop trigger if exists quiz_score_audit on public.quiz_scores;
create trigger quiz_score_audit before insert or update on public.quiz_scores for each row execute function public.quiz_audit_score();
alter table public.quiz_admins enable row level security;alter table public.quiz_teams enable row level security;alter table public.quiz_rounds enable row level security;alter table public.quiz_scores enable row level security;alter table public.quiz_score_history enable row level security;alter table public.quiz_settings enable row level security;
drop policy if exists "admin own row" on public.quiz_admins;create policy "admin own row" on public.quiz_admins for select to authenticated using(user_id=auth.uid());
drop policy if exists "public active teams" on public.quiz_teams;create policy "public active teams" on public.quiz_teams for select to anon,authenticated using(active=true or public.quiz_is_admin());
drop policy if exists "public active rounds" on public.quiz_rounds;create policy "public active rounds" on public.quiz_rounds for select to anon,authenticated using(active=true or public.quiz_is_admin());
drop policy if exists "public scores read" on public.quiz_scores;create policy "public scores read" on public.quiz_scores for select to anon,authenticated using(true);
drop policy if exists "public settings read" on public.quiz_settings;create policy "public settings read" on public.quiz_settings for select to anon,authenticated using(true);
drop policy if exists "admin teams all" on public.quiz_teams;create policy "admin teams all" on public.quiz_teams for all to authenticated using(public.quiz_is_admin()) with check(public.quiz_is_admin());
drop policy if exists "admin rounds all" on public.quiz_rounds;create policy "admin rounds all" on public.quiz_rounds for all to authenticated using(public.quiz_is_admin()) with check(public.quiz_is_admin());
drop policy if exists "admin scores all" on public.quiz_scores;create policy "admin scores all" on public.quiz_scores for all to authenticated using(public.quiz_is_admin()) with check(public.quiz_is_admin());
drop policy if exists "admin settings all" on public.quiz_settings;create policy "admin settings all" on public.quiz_settings for all to authenticated using(public.quiz_is_admin()) with check(public.quiz_is_admin());
drop policy if exists "admin history read" on public.quiz_score_history;create policy "admin history read" on public.quiz_score_history for select to authenticated using(public.quiz_is_admin());
grant usage on schema public to anon,authenticated;
grant select on public.quiz_teams,public.quiz_rounds,public.quiz_scores,public.quiz_settings to anon,authenticated;
grant insert,update,delete on public.quiz_teams,public.quiz_rounds,public.quiz_scores,public.quiz_settings to authenticated;
grant select on public.quiz_admins,public.quiz_score_history to authenticated;
-- Enable these four tables for Realtime in Supabase Database > Publications if not already enabled:
-- quiz_teams, quiz_rounds, quiz_scores, quiz_settings