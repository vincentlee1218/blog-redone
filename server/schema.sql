-- Run in the Supabase SQL editor
create table if not exists posts (
  id bigint generated always as identity primary key,
  title text not null,
  author text not null,
  excerpt text,
  content text not null,
  created_at timestamptz not null default now(),
  user_id bigint references users(id) -- alter table posts
);

create table if not exists users (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
