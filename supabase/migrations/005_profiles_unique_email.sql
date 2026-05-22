-- Prevent duplicate profile accounts by email (case-insensitive)
create unique index if not exists profiles_email_unique_idx
  on public.profiles ((lower(email)));
