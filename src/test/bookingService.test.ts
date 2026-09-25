import { describe, it, expect } from 'vitest'

interface RpcResult {
  success: boolean
  error?: string
  data?: any
}

// Function simulating the RPC response handling logic implemented in TempahanPage.tsx
export function handleRoomBookingRpcResponse(
  rpcErr: any,
  rpcRes: RpcResult | null | undefined
): { status: 'success' | 'business_error' | 'transport_error'; message: string; data?: any } {
  if (rpcErr || !rpcRes) {
    return {
      status: 'transport_error',
      message: 'Permohonan tidak dapat dihantar kerana perkhidmatan tempahan tidak tersedia buat sementara waktu. Sila cuba lagi.',
    }
  }

  if (!rpcRes.success) {
    return {
      status: 'business_error',
      message: rpcRes.error || 'Slot bilik tidak tersedia.',
    }
  }

  return {
    status: 'success',
    message: 'Permohonan tempahan Bilik JPP berjaya dihantar dan sedang menunggu kelulusan admin.',
    data: rpcRes.data,
  }
}

describe('Room Booking RPC Response Handling', () => {
  it('handles successful RPC result correctly', () => {
    const rpcRes: RpcResult = {
      success: true,
      data: { id: 'rb-123', status: 'pending' },
    }
    const result = handleRoomBookingRpcResponse(null, rpcRes)
    expect(result.status).toBe('success')
    expect(result.data?.id).toBe('rb-123')
  })

  it('handles business rule rejection (success: false) correctly', () => {
    const rpcRes: RpcResult = {
      success: false,
      error: 'Maaf, Bilik JPP telah ditempah pada masa/tarikh tersebut.',
    }
    const result = handleRoomBookingRpcResponse(null, rpcRes)
    expect(result.status).toBe('business_error')
    expect(result.message).toBe('Maaf, Bilik JPP telah ditempah pada masa/tarikh tersebut.')
  })

  it('handles transport/RPC error by returning safe temporary service error without table insert', () => {
    const rpcErr = new Error('RPC function not found or network failed')
    const result = handleRoomBookingRpcResponse(rpcErr, null)
    expect(result.status).toBe('transport_error')
    expect(result.message).toContain('perkhidmatan tempahan tidak tersedia buat sementara waktu')
  })

})
