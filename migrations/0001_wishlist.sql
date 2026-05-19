create table if not exists wishlists (
  id text primary key,
  name text not null default 'Family Gift Wishlist',
  created_at text not null,
  updated_at text not null,
  last_used_at text not null
);

create table if not exists wishlist_items (
  id text primary key,
  wishlist_id text not null references wishlists(id) on delete cascade,
  title text not null,
  link text not null default '',
  description text not null default '',
  selected_by text,
  created_at text not null,
  updated_at text not null,
  last_used_at text not null
);

create index if not exists wishlist_items_wishlist_created_idx
  on wishlist_items (wishlist_id, created_at);

create index if not exists wishlists_last_used_idx
  on wishlists (last_used_at);

create index if not exists wishlist_items_last_used_idx
  on wishlist_items (last_used_at);
