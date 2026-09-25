import { describe, it, expect } from 'vitest'
import { processRoomBookingRpcResponse, type RoomBookingRpcResult } from '../lib/bookingService'
import tempahanPageCode from '../pages/TempahanPage.tsx?raw'

const mockT = (bm: string, en: string) => bm

describe('Room Booking RPC Response Handling (processRoomBookingRpcResponse)', () => {
  it('handles successful RPC response correctly', () => {
    const rpcRes: RoomBookingRpcResult = {
      success: true,
      data: { id: 'rb-123', status: 'pending' },
    }
    const outcome = processRoomBookingRpcResponse(null, rpcRes, mockT)
    expect(outcome.ok).toBe(true)
    expect(outcome.data?.id).toBe('rb-123')
    expect(outcome.errorMessage).toBeUndefined()
  })

  it('handles business rule rejection (success: false) correctly', () => {
    const rpcRes: RoomBookingRpcResult = {
      success: false,
      error: 'Maaf, Bilik JPP telah ditempah pada masa/tarikh tersebut.',
    }
    const outcome = processRoomBookingRpcResponse(null, rpcRes, mockT)
    expect(outcome.ok).toBe(false)
    expect(outcome.errorMessage).toBe('Maaf, Bilik JPP telah ditempah pada masa/tarikh tersebut.')
  })

  it('handles RPC transport error correctly by failing closed with safe message', () => {
    const rpcErr = new Error('Database connection failed')
    const outcome = processRoomBookingRpcResponse(rpcErr, null, mockT)
    expect(outcome.ok).toBe(false)
    expect(outcome.errorMessage).toContain('perkhidmatan tempahan tidak tersedia buat sementara waktu')
  })

  it('handles null/undefined RPC response correctly by failing closed', () => {
    const outcomeNull = processRoomBookingRpcResponse(null, null, mockT)
    expect(outcomeNull.ok).toBe(false)
    expect(outcomeNull.errorMessage).toContain('perkhidmatan tempahan tidak tersedia buat sementara waktu')

    const outcomeUndefined = processRoomBookingRpcResponse(null, undefined, mockT)
    expect(outcomeUndefined.ok).toBe(false)
    expect(outcomeUndefined.errorMessage).toContain('perkhidmatan tempahan tidak tersedia buat sementara waktu')
  })

  it('safeguards that TempahanPage.tsx contains no direct room_bookings insert fallback', () => {
    expect(tempahanPageCode).not.toContain(".from('room_bookings').insert")
  })
})
