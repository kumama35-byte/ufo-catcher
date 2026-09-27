-- UFO CHACHERっぽいゲーム(仮) online ranking setup
-- Supabase SQL Editorで実行してください。複数回実行可能な構成です。
begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.ufo_rankings (
  id uuid primary key default gen_random_uuid(),
  player_name text not null default 'ゲストさん',
  score bigint not null,
  catches integer not null,
  registered_at timestamptz not null default now(),
  edit_token_hash text not null,
  constraint ufo_rankings_score_range check (score between 0 and 5000000),
  constraint ufo_rankings_catches_range check (catches between 0 and 330)
);

-- ステージごとの増加数を最大+6体へ変更した現行仕様（10ステージ最大330体）へ追従する。
alter table public.ufo_rankings
  drop constraint if exists ufo_rankings_catches_range;
alter table public.ufo_rankings
  add constraint ufo_rankings_catches_range check (catches between 0 and 330);

create index if not exists ufo_rankings_order_idx
  on public.ufo_rankings (score desc, catches desc, registered_at asc, id asc);

alter table public.ufo_rankings enable row level security;

-- PUBLIC/anon/authenticatedの既定権限を剥奪し、公開列の読み取りだけを戻す。
-- edit_token_hashはData APIから読み取れない。
revoke all privileges on table public.ufo_rankings from public, anon, authenticated;
grant select (id, player_name, score, catches, registered_at)
  on table public.ufo_rankings to anon, authenticated;

drop policy if exists "public leaderboard read" on public.ufo_rankings;
create policy "public leaderboard read"
  on public.ufo_rankings
  for select
  to anon, authenticated
  using (true);

create or replace function public.submit_ufo_score(
  p_score bigint,
  p_catches integer,
  p_edit_token text
)
returns table(entry_id uuid, qualified boolean, ranking integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  new_rank integer;
begin
  -- UUID形式、現在の10ステージ構成で到達可能な範囲、最低得点を検査する。
  if p_edit_token is null
    or p_edit_token !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    or p_score is null
    or p_catches is null
    or p_score not between 0 and 5000000
    or p_catches not between 0 and 330
    or (p_catches = 0 and p_score <> 0)
    or (p_catches > 0 and p_score < p_catches::bigint * 100)
  then
    raise exception 'invalid score submission' using errcode = '22023';
  end if;

  -- 登録、順位計算、31位以下の整理を直列化し、同時登録による取りこぼしを防ぐ。
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('ufo_rankings_top30_v1'));

  insert into public.ufo_rankings (
    player_name, score, catches, registered_at, edit_token_hash
  ) values (
    'ゲストさん',
    p_score,
    p_catches,
    pg_catalog.clock_timestamp(),
    pg_catalog.encode(extensions.digest(p_edit_token, 'sha256'), 'hex')
  )
  returning id into new_id;

  select ranked.position::integer
    into new_rank
  from (
    select
      r.id,
      pg_catalog.row_number() over (
        order by r.score desc, r.catches desc, r.registered_at asc, r.id asc
      ) as position
    from public.ufo_rankings as r
  ) as ranked
  where ranked.id = new_id;

  delete from public.ufo_rankings as doomed
  where doomed.id in (
    select r.id
    from public.ufo_rankings as r
    order by r.score desc, r.catches desc, r.registered_at asc, r.id asc
    offset 30
  );

  return query select new_id, (new_rank <= 30), new_rank;
end;
$$;

alter function public.submit_ufo_score(bigint, integer, text) owner to postgres;

-- CREATE FUNCTION直後はPUBLICにEXECUTEが付くため、明示的に全公開ロールから剥奪する。
revoke all on function public.submit_ufo_score(bigint, integer, text)
  from public, anon, authenticated;
grant execute on function public.submit_ufo_score(bigint, integer, text)
  to anon, authenticated;

create or replace function public.rename_ufo_score(
  p_entry_id uuid,
  p_edit_token text,
  p_player_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text;
begin
  if p_entry_id is null
    or p_edit_token is null
    or p_edit_token !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    or p_player_name is null
  then
    raise exception 'invalid rename request' using errcode = '22023';
  end if;

  -- NFKC正規化後、制御文字とHTMLで危険な文字を除去する。
  clean_name := pg_catalog.btrim(
    pg_catalog.regexp_replace(
      normalize(p_player_name, NFKC),
      '[[:cntrl:]<>&"'']',
      '',
      'g'
    )
  );

  if pg_catalog.char_length(clean_name) not between 1 and 10
    or clean_name !~ '^[[:alnum:]ぁ-んァ-ヶ一-龠々ー＿_・ -]+$'
    or clean_name ~* '(死ね|ころす|殺す|ばか|バカ|アホ|くそ|クソ|fuck|shit|sex|admin|運営)'
  then
    raise exception 'invalid player name' using errcode = '22023';
  end if;

  update public.ufo_rankings as target
  set player_name = clean_name
  where target.id = p_entry_id
    and target.edit_token_hash = pg_catalog.encode(
      extensions.digest(p_edit_token, 'sha256'),
      'hex'
    );

  if not found then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
end;
$$;

alter function public.rename_ufo_score(uuid, text, text) owner to postgres;

revoke all on function public.rename_ufo_score(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.rename_ufo_score(uuid, text, text)
  to anon, authenticated;

commit;
