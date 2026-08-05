export type Language = 'bm' | 'en'
export type Theme = 'light' | 'dark'
export type UserRole = 'user' | 'admin'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  class_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title_bm: string
  title_en: string | null
  content_bm: string
  content_en: string | null
  poster_url: string | null
  published: boolean
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  sort_order: number
  name: string
  position_bm: string
  position_en: string | null
  unit_bm: string | null
  unit_en: string | null
  class_name: string | null
  duties_bm: string | null
  duties_en: string | null
  photo_url: string | null
  active: boolean
}

export interface IkesApplication {
  id: string
  user_id: string
  applicant_name: string
  class_name: string
  phone: string
  ikes_type: 'care' | 'go_home'
  amount: number
  reason: string
  ticket_path: string | null
  status: RequestStatus
  admin_notes: string | null
  repayment_due_at: string | null
  repaid_at: string | null
  created_at: string
  updated_at: string
}

export interface AssetItem {
  id: string
  name_bm: string
  name_en: string | null
  description_bm: string | null
  description_en: string | null
  stock_total: number
  stock_available: number
  active: boolean
  image_url: string | null
}

export interface AssetApplication {
  id: string
  user_id: string
  applicant_name: string
  class_name: string
  phone: string
  asset_id: string
  quantity: number
  borrow_date: string
  return_date: string
  purpose: string
  status: RequestStatus
  admin_notes: string | null
  returned_at: string | null
  created_at: string
  updated_at: string
  asset_items?: AssetItem | null
}

export interface Donation {
  id: string
  user_id: string
  donor_name: string | null
  amount: number
  payment_method: 'qr' | 'bank_transfer' | 'cash'
  proof_path: string | null
  reference_no: string | null
  message: string | null
  status: 'pending' | 'verified' | 'rejected'
  created_at: string
  updated_at: string
}

export interface FundDisbursement {
  id: string
  title_bm: string
  title_en: string | null
  description_bm: string | null
  description_en: string | null
  amount: number
  disbursed_at: string
  is_public: boolean
  created_at: string
}

export interface DonationSettings {
  id: number
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  qr_url: string | null
  note_bm: string | null
  note_en: string | null
  updated_at: string
}

export interface FundSummary {
  total_verified: number
  total_disbursed: number
  balance: number
}
