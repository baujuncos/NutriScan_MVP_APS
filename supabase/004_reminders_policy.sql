-- Policy to allow public read access to the profiles table for reminders

create policy "public read for reminders"
  on public.profiles for select
  to anon
  using (true);