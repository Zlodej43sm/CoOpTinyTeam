alter table wishlists add column edit_token text;

update wishlists
set edit_token = lower(hex(randomblob(16)))
where edit_token is null;

create unique index if not exists wishlists_edit_token_idx
  on wishlists (edit_token);
