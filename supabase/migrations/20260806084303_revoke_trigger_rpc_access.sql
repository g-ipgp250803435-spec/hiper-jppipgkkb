begin;

-- Fungsi ini hanya digunakan secara dalaman oleh trigger perubahan status e-Aset.
-- Ia tidak perlu dipanggil terus melalui Supabase Data API.
revoke execute
  on function public.sync_asset_stock_from_request()
  from public, anon, authenticated;

commit;
