-- Comments feature. Run in the Supabase SQL editor (after schema.sql).

create table if not exists comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id) on delete cascade, -- deleting a post deletes its comments
  user_id bigint not null references users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Loading one post's comments in order is the main query.
create index if not exists comments_post_id_created_at_idx on comments (post_id, created_at);

-- Comment totals per post (same idea as post_vote_counts). Posts with no comments have NO row here.
create or replace view post_comment_counts as
select post_id, count(*) as comment_count
from comments
group by post_id;
