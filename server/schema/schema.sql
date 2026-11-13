-- Run in the Supabase SQL editor
create table if not exists users (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id bigint generated always as identity primary key,
  title text not null,
  author text not null,
  excerpt text,
  content text not null,
  created_at timestamptz not null default now(),
  user_id bigint references users(id) -- alter table posts
);

create table if not exists votes (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id),
  post_id bigint not null references posts(id),
  value smallint not null check (value in (1, -1)),
  response boolean default true,
  created_at timestamptz not null default now(),
  unique (post_id, user_id) -- each user gets one vote for each post
);

create index if not exists votes_post_id_idx on votes (post_id);

-- Totals per post, so you don't have to count in JS
create or replace view post_vote_counts as
select
  post_id,
  count(*) filter (where value = 1)  as upvotes,
  count(*) filter (where value = -1) as downvotes
from votes
group by post_id;
