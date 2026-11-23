-- ============================================================
-- CRAFTJAI v2 Database Schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  preferred_language text default 'th',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. DIARY_ENTRIES
create type mood_type as enum (
  'joy', 'trust', 'fear', 'sadness',
  'surprise', 'disgust', 'anger', 'anticipation'
);

create table public.diary_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  primary_mood mood_type,
  valence real check (valence >= -1 and valence <= 1),
  arousal real check (arousal >= 0 and arousal <= 1),
  dominance real check (dominance >= 0 and dominance <= 1),
  mood_confidence real check (mood_confidence >= 0 and mood_confidence <= 1),
  context_location text,
  context_activity text,
  context_social_setting text,
  character_prompt text,
  mascot_response text,
  word_count int generated always as (
    array_length(regexp_split_to_array(trim(content), '\s+'), 1)
  ) stored,
  language text default 'th',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.diary_entries enable row level security;
create policy "Users can view own entries" on public.diary_entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on public.diary_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on public.diary_entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on public.diary_entries for delete using (auth.uid() = user_id);

create index idx_diary_entries_user_id on public.diary_entries(user_id);
create index idx_diary_entries_created_at on public.diary_entries(created_at desc);

-- 3. CHARACTERS
create type rarity_type as enum ('common', 'uncommon', 'rare', 'legendary');

create table public.characters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  diary_entry_id uuid references public.diary_entries(id) on delete cascade not null unique,
  mood mood_type not null,
  animal text not null,
  animal_name text not null,
  color text not null,
  image_url text not null,
  image_path text not null,
  rarity rarity_type default 'common' not null,
  power_level int default 0 not null,
  evolution_level int default 1 not null,
  generation_prompt text,
  generation_model text default 'FLUX.1-schnell',
  created_at timestamptz default now() not null
);

alter table public.characters enable row level security;
create policy "Users can view own characters" on public.characters for select using (auth.uid() = user_id);
create policy "Users can insert own characters" on public.characters for insert with check (auth.uid() = user_id);

create index idx_characters_user_id on public.characters(user_id);
create index idx_characters_mood on public.characters(mood);
create index idx_characters_created_at on public.characters(created_at desc);

-- 4. STREAKS
create table public.streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak int default 0 not null,
  longest_streak int default 0 not null,
  last_entry_date date,
  total_entries int default 0 not null,
  updated_at timestamptz default now() not null
);

alter table public.streaks enable row level security;
create policy "Users can view own streaks" on public.streaks for select using (auth.uid() = user_id);
create policy "Users can update own streaks" on public.streaks for update using (auth.uid() = user_id);
create policy "Users can insert own streaks" on public.streaks for insert with check (auth.uid() = user_id);

-- Auto-update streak on new diary entry
create or replace function public.update_streak()
returns trigger as $$
declare
  today date := current_date;
  rec record;
begin
  select * into rec from public.streaks where user_id = new.user_id;
  if rec is null then
    insert into public.streaks (user_id, current_streak, longest_streak, last_entry_date, total_entries)
    values (new.user_id, 1, 1, today, 1);
  elsif rec.last_entry_date = today then
    update public.streaks set total_entries = total_entries + 1, updated_at = now() where user_id = new.user_id;
  elsif rec.last_entry_date = today - interval '1 day' then
    update public.streaks set
      current_streak = current_streak + 1,
      longest_streak = greatest(longest_streak, current_streak + 1),
      last_entry_date = today,
      total_entries = total_entries + 1,
      updated_at = now()
    where user_id = new.user_id;
  else
    update public.streaks set
      current_streak = 1,
      last_entry_date = today,
      total_entries = total_entries + 1,
      updated_at = now()
    where user_id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_diary_entry_created
  after insert on public.diary_entries
  for each row execute function public.update_streak();

-- 5. ACHIEVEMENTS
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamptz default now() not null,
  unique(user_id, achievement_key)
);

alter table public.achievements enable row level security;
create policy "Users can view own achievements" on public.achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on public.achievements for insert with check (auth.uid() = user_id);

-- 6. STORAGE BUCKET
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('characters', 'characters', true, 524288, array['image/webp', 'image/png']::text[])
on conflict (id) do nothing;

create policy "Users can upload own images" on storage.objects for insert
  with check (bucket_id = 'characters' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view character images" on storage.objects for select
  using (bucket_id = 'characters');
