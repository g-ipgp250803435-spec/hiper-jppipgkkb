begin;

-- 1. Tetapkan search_path untuk fungsi trigger biasa.
alter function public.set_updated_at()
  set search_path = public;

-- 2. Fungsi penciptaan profil hanya untuk proses Supabase Auth.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;

-- 3. RPC kemas kini profil menggunakan hak pengguna yang sedang log masuk.
alter function public.update_my_profile(text, text)
  security invoker;
revoke execute on function public.update_my_profile(text, text)
  from public, anon;
grant execute on function public.update_my_profile(text, text)
  to authenticated;

-- 4. Polisi bacaan awam tidak lagi perlu memanggil is_admin() untuk pengguna anon.
alter policy "Public read published announcements"
  on public.announcements
  to anon, authenticated
  using (published = true);

alter policy "Public read active assets"
  on public.asset_items
  to anon, authenticated
  using (active = true);

alter policy "Public read public disbursements"
  on public.fund_disbursements
  to anon, authenticated
  using (is_public = true);

alter policy "Public read active organization"
  on public.organization_members
  to anon, authenticated
  using (active = true);

-- 5. Hadkan fungsi bantuan RLS kepada pengguna yang telah log masuk.
revoke execute on function public.is_admin()
  from public, anon;
grant execute on function public.is_admin()
  to authenticated;

revoke execute on function public.is_allowed_user()
  from public, anon;
grant execute on function public.is_allowed_user()
  to authenticated;

-- 6. Fungsi trigger dalaman tidak boleh dipanggil oleh anon.
-- Akses authenticated dikekalkan dahulu untuk mengurangkan risiko gangguan.
revoke execute on function public.protect_profile_role()
  from public, anon;
grant execute on function public.protect_profile_role()
  to authenticated;

revoke execute on function public.set_updated_at()
  from public, anon;
grant execute on function public.set_updated_at()
  to authenticated;

revoke execute on function public.sync_asset_stock_from_request()
  from public, anon;
grant execute on function public.sync_asset_stock_from_request()
  to authenticated;

-- 7. Ringkasan Tabung Jumaat kekal sebagai RPC awam yang disengajakan.
revoke execute on function public.get_public_fund_summary()
  from public;
grant execute on function public.get_public_fund_summary()
  to anon, authenticated;

-- 8. URL fail public-media kekal awam, tetapi senarai objek hanya untuk admin.
drop policy if exists "Public reads public media"
  on storage.objects;

drop policy if exists "Admins read public media metadata"
  on storage.objects;

create policy "Admins read public media metadata"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'public-media'
    and public.is_admin()
  );

commit;
