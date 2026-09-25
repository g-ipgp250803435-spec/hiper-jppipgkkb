export interface RoomBookingRpcResult {
  success: boolean
  error?: string
  data?: any
}

export interface ProcessedBookingRpcOutcome {
  ok: boolean
  errorMessage?: string
  data?: any
}

export function processRoomBookingRpcResponse(
  rpcErr: any,
  rpcRes: RoomBookingRpcResult | null | undefined,
  t: (bm: string, en: string) => string
): ProcessedBookingRpcOutcome {
  if (rpcErr || !rpcRes) {
    if (rpcErr) {
      console.error('Room booking RPC error:', rpcErr)
    } else {
      console.error('Room booking RPC returned empty response')
    }
    return {
      ok: false,
      errorMessage: t(
        'Permohonan tidak dapat dihantar kerana perkhidmatan tempahan tidak tersedia buat sementara waktu. Sila cuba lagi.',
        'The booking request could not be submitted because the booking service is temporarily unavailable. Please try again.'
      ),
    }
  }

  if (!rpcRes.success) {
    return {
      ok: false,
      errorMessage: rpcRes.error || t('Slot bilik tidak tersedia.', 'Room slot unavailable.'),
    }
  }

  return {
    ok: true,
    data: rpcRes.data,
  }
}
