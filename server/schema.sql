-- Run in the Supabase SQL editor
create table if not exists posts (
  id bigint generated always as identity primary key,
  title text not null,
  author text not null,
  excerpt text,
  content text not null,
  created_at timestamptz not null default now()
);
