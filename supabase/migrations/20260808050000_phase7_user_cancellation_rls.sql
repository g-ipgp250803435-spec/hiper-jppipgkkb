-- Phase 7: RLS policies allowing users to cancel their own pending applications

drop policy if exists "Users cancel own pending asset requests" on public.asset_applications;
create policy "Users cancel own pending asset requests" on public.asset_applications
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');

drop policy if exists "Users cancel own pending ikes requests" on public.ikes_applications;
create policy "Users cancel own pending ikes requests" on public.ikes_applications
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');

drop policy if exists "Users cancel own pending donations" on public.donations;
create policy "Users cancel own pending donations" on public.donations
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');

drop policy if exists "Users cancel own pending room bookings" on public.room_bookings;
create policy "Users cancel own pending room bookings" on public.room_bookings
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');

drop policy if exists "Users cancel own pending kpk requests" on public.kpk_applications;
create policy "Users cancel own pending kpk requests" on public.kpk_applications
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');
