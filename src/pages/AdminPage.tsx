import { useEffect, useState } from 'react'
import { Button, LoadingBlock, Notice, PageHeader } from '../components/UI'
import { Icon } from '../components/Icons'
import SiteSettingsEditor from '../components/admin/SiteSettingsEditor'
import AdminOverview from '../components/admin/AdminOverview'
import AdminIkes from '../components/admin/AdminIkes'
import AdminKpk from '../components/admin/AdminKpk'
import AdminTempahan from '../components/admin/AdminTempahan'
import AdminAssets from '../components/admin/AdminAssets'
import AdminDonations from '../components/admin/AdminDonations'
import AdminAnnouncements from '../components/admin/AdminAnnouncements'
import AdminOrganization from '../components/admin/AdminOrganization'
import AdminNotificationDropdown from '../components/admin/AdminNotificationDropdown'
import AdminCMS from '../components/admin/AdminCMS'
import { notifyUser } from '../lib/v3/notificationService'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { getErrorMessage, isPremiumSchemaMissingError, uploadPublicFile } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type {
  Announcement,
  AssetApplication,
  AssetItem,
  Donation,
  DonationSettings,
  FundDisbursement,
  IkesApplication,
  KpkApplication,
  KpkBureau,
  Notification,
  OrganizationMember,
  BookingService,
  RoomBooking,
} from '../lib/types'

type AdminTab = 'overview' | 'ikes' | 'kpk' | 'tempahan' | 'assets-requests' | 'donations' | 'announcements' | 'catalogue' | 'organization' | 'fund' | 'cms' | 'site'

export default function AdminPage() {
  const { language, t } = useUi()
  const { user } = useAuth()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [notifOpen, setNotifOpen] = useState(false)

  const [ikes, setIkes] = useState<IkesApplication[]>([])
  const [kpkApplications, setKpkApplications] = useState<KpkApplication[]>([])
  const [kpkBureaus, setKpkBureaus] = useState<KpkBureau[]>([])
  const [bookingServices, setBookingServices] = useState<BookingService[]>([])
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([])
  const [assetRequests, setAssetRequests] = useState<AssetApplication[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [catalogue, setCatalogue] = useState<AssetItem[]>([])
  const [assetCategories, setAssetCategories] = useState<import('../lib/types').AssetCategory[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [disbursements, setDisbursements] = useState<FundDisbursement[]>([])
  const [donationSettings, setDonationSettings] = useState<DonationSettings | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [cmsPages, setCmsPages] = useState<import('../lib/types').CmsPage[]>([])
  const [cmsBlocks, setCmsBlocks] = useState<import('../lib/types').CmsPageBlock[]>([])

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [premiumDbReady, setPremiumDbReady] = useState<boolean | null>(null)

  const loadAll = async () => {
    setLoading(true)
    if (!isSupabaseConfigured) {
      setIkes([
        {
          id: 'mock-ikes-1',
          user_id: 'mock-user-1',
          applicant_name: 'Muhammad Faris Bin Husin',
          class_name: 'PISMP BM SK 1',
          phone: '011-2345678',
          ikes_type: 'care',
          amount: 50,
          reason: 'Kecemasan perubatan keluarga.',
          ticket_path: null,
          status: 'pending',
          admin_notes: null,
          repayment_due_at: null,
          repaid_at: null,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      setAssetRequests([
        {
          id: 'mock-asset-1',
          user_id: 'mock-user-3',
          applicant_name: 'Tan Wei Jin',
          class_name: 'PISMP BC SJKC',
          department_unit: 'Jabatan Bahasa',
          phone: '012-3456789',
          asset_id: 'mock-item-1',
          quantity: 2,
          borrow_date: new Date(Date.now() + 3600000 * 24).toISOString(),
          return_date: new Date(Date.now() + 3600000 * 48).toISOString(),
          purpose: 'Latihan sukan tahunan.',
          aku_janji_agreed: true,
          status: 'pending',
          admin_notes: null,
          returned_at: null,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          updated_at: new Date().toISOString(),
          asset_items: {
            id: 'mock-item-1',
            asset_code: 'AST-001',
            category_bm: 'Audio',
            category_en: 'Audio',
            sort_order: 1,
            name_bm: 'Sistem PA Mudah Alih',
            name_en: 'Portable PA System',
            description_bm: 'Set PA mudah alih lengkap',
            description_en: 'Complete portable PA set',
            stock_total: 5,
            stock_available: 1,
            active: true,
            image_url: null,
          },
        },
      ])
      setDonations([
        {
          id: 'mock-donation-1',
          user_id: 'mock-user-4',
          donor_name: 'Hamba Allah',
          amount: 150,
          payment_method: 'qr',
          proof_path: null,
          reference_no: 'REF778899',
          message: 'Sumbangan mingguan Tabung Jumaat.',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      setAnnouncements([
        {
          id: 'mock-ann-1',
          title_bm: 'Gotong-Royong Perdana Asrama',
          title_en: 'Grand Hostel Cleaning Campaign',
          content_bm: 'Semua siswa guru dijemput hadir.',
          content_en: 'All student teachers are invited.',
          poster_url: null,
          published: true,
          pinned: true,
          pin_type: 'penting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      setCatalogue([
        {
          id: 'mock-item-1',
          asset_code: 'AST-001',
          category_bm: 'Audio Visual',
          category_en: 'Audio Visual',
          sort_order: 1,
          name_bm: 'Sistem PA Mudah Alih',
          name_en: 'Portable PA System',
          description_bm: 'Set PA mudah alih lengkap',
          description_en: 'Complete portable PA set',
          stock_total: 5,
          stock_available: 1,
          active: true,
          image_url: null,
        },
      ])
      setAssetCategories([
        { id: 'cat-1', name_bm: 'Elektronik', name_en: 'Electronics', display_order: 1 },
        { id: 'cat-2', name_bm: 'Peralatan Program', name_en: 'Program Equipment', display_order: 2 },
        { id: 'cat-3', name_bm: 'Perabot', name_en: 'Furniture', display_order: 3 },
        { id: 'cat-4', name_bm: 'Audio Visual', name_en: 'Audio Visual', display_order: 4 },
        { id: 'cat-5', name_bm: 'Lain-lain', name_en: 'Others', display_order: 5 },
      ])
      setMembers([
        {
          id: 'mock-member-1',
          parent_id: null,
          node_type: 'leadership',
          sort_order: 1,
          name: 'Encik Ahmad Bin Ali',
          position_bm: 'Bendahari Agung Kehormat',
          position_en: 'Honorary Treasurer General',
          unit_bm: 'Pentadbiran',
          unit_en: 'Administration',
          class_name: 'Jabatan HEP',
          duties_bm: 'Penyelaras Perbendaharaan',
          duties_en: 'Treasury Coordinator',
          photo_url: null,
          active: true,
        },
      ])
      setDisbursements([])
      setDonationSettings({
        id: 1,
        bank_name: 'Bank Islam Malaysia Berhad',
        account_name: 'PBAK IPG KKB',
        account_number: '03018010012345',
        qr_url: null,
        note_bm: 'Sila sertakan rujukan "PBAK".',
        note_en: 'Please include reference "PBAK".',
        updated_at: new Date().toISOString(),
      })
      setNotifications([
        {
          id: 'mock-notif-1',
          recipient_id: null,
          title: 'Permohonan e-Aset Baharu',
          message: 'Ahmad submitted an asset request.',
          notification_type: 'e_aset',
          reference_id: 'mock-asset-1',
          is_read: false,
          created_at: new Date(Date.now() - 120000).toISOString(),
        },
        {
          id: 'mock-notif-2',
          recipient_id: null,
          title: 'Permohonan KPK+ Baharu',
          message: 'Kelab ABC submitted a loan request.',
          notification_type: 'kpk',
          reference_id: 'mock-kpk-1',
          is_read: false,
          created_at: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: 'mock-notif-3',
          recipient_id: null,
          title: 'Permohonan iKES Baharu',
          message: 'Student XYZ submitted an application.',
          notification_type: 'ikes',
          reference_id: 'mock-ikes-1',
          is_read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ])
      setCmsPages([
        {
          id: 'mock-cms-1',
          title_bm: 'Dasar Privasi',
          title_en: 'Privacy Policy',
          slug: 'dasar-privasi',
          description_bm: 'Dasar privasi dan perlindungan data bagi HiPER.',
          description_en: 'Privacy policy and data protection for HiPER.',
          status: 'published',
          is_public: true,
          show_in_navigation: false,
          navigation_order: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      setCmsBlocks([
        {
          id: 'mock-block-1',
          page_id: 'mock-cms-1',
          block_type: 'rich_text',
          content: {
            heading_bm: '1. Pengenalan',
            heading_en: '1. Introduction',
            body_bm: 'Hab Perbendaharaan Digital (HiPER) dikendalikan oleh Pejabat Bendahari Agung Kehormat JPP IPG Kampus Kota Bharu.',
            body_en: 'The Digital Treasury Hub (HiPER) is managed by the Office of the Honorary Treasurer General JPP IPG Kampus Kota Bharu.',
          },
          display_order: 1,
        },
      ])
      setLoading(false)
      return
    }

    try {
      const results = await Promise.all([
        supabase.from('ikes_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('kpk_applications').select('*, kpk_bureaus(*)').order('created_at', { ascending: false }),
        supabase.from('kpk_bureaus').select('*').order('display_order', { ascending: true }),
        supabase.from('asset_applications').select('*, asset_items(*)').order('created_at', { ascending: false }),
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('asset_items').select('*').order('name_bm'),
        supabase.from('organization_members').select('*').order('sort_order'),
        supabase.from('fund_disbursements').select('*').order('disbursed_at', { ascending: false }),
        supabase.from('donation_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('booking_services').select('*').order('created_at', { ascending: true }),
        supabase.from('room_bookings').select('*').order('booking_date', { ascending: false }),
        supabase.from('cms_pages').select('*').order('navigation_order', { ascending: true }),
        supabase.from('cms_page_blocks').select('*').order('display_order', { ascending: true }),
        supabase.from('asset_categories').select('*').order('display_order', { ascending: true }),
      ])
      const firstError = results.find((result) => result.error)?.error
      if (firstError) setNotice({ type: 'danger', text: firstError.message })
      setIkes((results[0].data as IkesApplication[]) || [])
      setKpkApplications((results[1].data as KpkApplication[]) || [])
      setKpkBureaus((results[2].data as KpkBureau[]) || [])
      setAssetRequests((results[3].data as AssetApplication[]) || [])
      setDonations((results[4].data as Donation[]) || [])
      setAnnouncements((results[5].data as Announcement[]) || [])
      setCatalogue((results[6].data as AssetItem[]) || [])
      setMembers((results[7].data as OrganizationMember[]) || [])
      setDisbursements((results[8].data as FundDisbursement[]) || [])
      setDonationSettings((results[9].data as DonationSettings | null) || null)
      setNotifications((results[10].data as Notification[]) || [])
      setBookingServices((results[11].data as BookingService[]) || [])
      setRoomBookings((results[12].data as RoomBooking[]) || [])
      setCmsPages((results[13].data as import('../lib/types').CmsPage[]) || [])
      setCmsBlocks((results[14].data as import('../lib/types').CmsPageBlock[]) || [])
      setAssetCategories((results[15].data as import('../lib/types').AssetCategory[]) || [
        { id: 'cat-1', name_bm: 'Elektronik', name_en: 'Electronics', display_order: 1 },
        { id: 'cat-2', name_bm: 'Peralatan Program', name_en: 'Program Equipment', display_order: 2 },
        { id: 'cat-3', name_bm: 'Perabot', name_en: 'Furniture', display_order: 3 },
        { id: 'cat-4', name_bm: 'Audio Visual', name_en: 'Audio Visual', display_order: 4 },
        { id: 'cat-5', name_bm: 'Lain-lain', name_en: 'Others', display_order: 5 },
      ])
    } catch (err) {
      setNotice({
        type: 'danger',
        text: err instanceof Error ? err.message : 'Gagal memuatkan data dari pangkalan data.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()

    if (!isSupabaseConfigured) {
      setPremiumDbReady(true)
      return
    }

    void Promise.all([
      supabase.from('site_settings').select('id').eq('id', 1).maybeSingle(),
      supabase.from('asset_items').select('id, asset_code, sort_order').limit(1),
      supabase.from('organization_members').select('id, parent_id, node_type').limit(1),
    ]).then((results) => {
      setPremiumDbReady(!results.some((result) => result.error))
    })
  }, [])

  const runAction = async (action: () => Promise<void>, successText: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await action()
      setNotice({ type: 'success', text: successText })
      if (isSupabaseConfigured) {
        await loadAll()
      }
    } catch (error) {
      const fallback = t('Tindakan gagal.', 'Action failed.')
      const message = getErrorMessage(error, fallback)
      setNotice({
        type: 'danger',
        text: isPremiumSchemaMissingError(error)
          ? t(
              `Pangkalan data HiPER Premium belum lengkap. Jalankan fail SUPABASE-ONE-TIME-REPAIR.sql di Supabase SQL Editor. Butiran: ${message}`,
              `The HiPER Premium database upgrade is incomplete. Run SUPABASE-ONE-TIME-REPAIR.sql in the Supabase SQL Editor. Details: ${message}`
            )
          : message,
      })
    } finally {
      setBusy(false)
    }
  }

  const updateIkes = async (item: IkesApplication) => {
    await runAction(async () => {
      const { error } = await supabase.from('ikes_applications').update({
        status: item.status,
        admin_notes: item.admin_notes,
        repayment_due_at: item.repayment_due_at || null,
        repaid_at: item.repaid_at || null,
      }).eq('id', item.id)
      if (error) throw error

      await notifyUser(
        item.user_id,
        `Status iKES Dikemas Kini`,
        `Permohonan iKES anda telah dikemas kini kepada status: ${item.status.toUpperCase()}.`,
        'ikes',
        item.id
      )
    }, 'Permohonan iKES dikemas kini.')
  }

  const updateKpkApplication = async (item: KpkApplication) => {
    await runAction(async () => {
      const { error } = await supabase.from('kpk_applications').update({
        status: item.status,
        admin_notes: item.admin_notes,
        updated_at: new Date().toISOString(),
      }).eq('id', item.id)
      if (error) throw error

      let statusMsg = `Permohonan pinjaman KPK+ bagi ${item.club_name} kini berstatus: ${item.status.toUpperCase()}.`
      if (item.status === 'approved') statusMsg = `Tahniah! Permohonan KPK+ bagi ${item.club_name} telah diluluskan.`
      else if (item.status === 'rejected') statusMsg = `Permohonan KPK+ bagi ${item.club_name} telah ditolak.`

      await notifyUser(item.user_id, `Status KPK+ Dikemas Kini`, statusMsg, 'kpk', item.id)
    }, 'Permohonan KPK+ dikemas kini.')
  }

  const updateRoomBooking = async (item: RoomBooking) => {
    await runAction(async () => {
      const { error } = await supabase.from('room_bookings').update({
        booking_date: item.booking_date,
        status: item.status,
        admin_notes: item.admin_notes,
        updated_at: new Date().toISOString(),
      }).eq('id', item.id)
      if (error) throw error

      if (item.user_id) {
        let msg = `Status Tempahan Bilik JPP anda bagi tarikh ${item.booking_date} kini berstatus: ${item.status.toUpperCase()}.`
        if (item.status === 'approved') msg = `Tahniah! Tempahan Bilik JPP anda bagi tarikh ${item.booking_date} telah DILULUSKAN.`
        else if (item.status === 'rejected') msg = `Maaf, Tempahan Bilik JPP anda bagi tarikh ${item.booking_date} telah DITOLAK.`

        await notifyUser(item.user_id, `Status Tempahan Bilik JPP Dikemas Kini`, msg, 'tempahan', item.id)
      }
    }, 'Tempahan bilik JPP dikemas kini.')
  }

  const saveBookingService = async (
    form: {
      title_bm: string
      title_en: string
      description_bm: string
      description_en: string
      instructions_bm: string
      instructions_en: string
      booking_type: string
      external_link: string | null
      active: boolean
      image_url: string | null
    },
    editingId: string | null
  ) => {
    await runAction(async () => {
      const payload = {
        title_bm: form.title_bm,
        title_en: form.title_en || null,
        description_bm: form.description_bm || null,
        description_en: form.description_en || null,
        instructions_bm: form.instructions_bm || null,
        instructions_en: form.instructions_en || null,
        booking_type: form.booking_type,
        external_link: form.external_link || null,
        active: form.active,
        image_url: form.image_url,
      }
      const query = editingId
        ? supabase.from('booking_services').update(payload).eq('id', editingId)
        : supabase.from('booking_services').insert(payload)
      const { error } = await query
      if (error) throw error
    }, editingId ? 'Perkhidmatan tempahan dikemas kini.' : 'Perkhidmatan tempahan ditambah.')
  }

  const saveKpkBureau = async (form: { id?: string; name: string; active: boolean; display_order: number }) => {
    await runAction(async () => {
      const payload = {
        name: form.name,
        active: form.active,
        display_order: Number(form.display_order),
      }
      const query = form.id
        ? supabase.from('kpk_bureaus').update(payload).eq('id', form.id)
        : supabase.from('kpk_bureaus').insert(payload)
      const { error } = await query
      if (error) throw error
    }, form.id ? 'Biro Angkat dikemas kini.' : 'Biro Angkat ditambah.')
  }

  const updateAssetRequest = async (item: AssetApplication) => {
    await runAction(async () => {
      const { error } = await supabase.from('asset_applications').update({
        status: item.status,
        admin_notes: item.admin_notes,
        returned_at: item.returned_at || null,
      }).eq('id', item.id)
      if (error) throw error

      await notifyUser(
        item.user_id,
        `Status e-Aset Dikemas Kini`,
        `Permohonan e-Aset anda telah dikemas kini kepada status: ${item.status.toUpperCase()}.`,
        'e_aset',
        item.id
      )
    }, 'Permohonan e-Aset dikemas kini.')
  }

  const updateDonation = async (item: Donation) => {
    await runAction(async () => {
      const { error } = await supabase.from('donations').update({ status: item.status }).eq('id', item.id)
      if (error) throw error
    }, 'Rekod derma dikemas kini.')
  }

  const saveAnnouncement = async (
    form: {
      title_bm: string
      title_en: string
      content_bm: string
      content_en: string
      published: boolean
      pinned: boolean
      pin_type: string
      expiry_at: string
      poster_url: string | null
    },
    posterFile: File | null,
    editingId: string | null,
    resetForm: () => void
  ) => {
    await runAction(async () => {
      let posterUrl = form.poster_url
      if (posterFile) posterUrl = await uploadPublicFile(supabase, posterFile, 'announcements')
      const payload = {
        title_bm: form.title_bm,
        title_en: form.title_en || null,
        content_bm: form.content_bm,
        content_en: form.content_en || null,
        published: form.published,
        pinned: form.pin_type !== 'none',
        pin_type: form.pin_type,
        expiry_at: form.expiry_at ? new Date(`${form.expiry_at}T23:59:59`).toISOString() : null,
        poster_url: posterUrl,
      }
      const query = editingId
        ? supabase.from('announcements').update(payload).eq('id', editingId)
        : supabase.from('announcements').insert(payload)
      const { error } = await query
      if (error) throw error
      resetForm()
    }, editingId ? 'Pengumuman dikemas kini.' : 'Pengumuman ditambah.')
  }

  const saveAsset = async (
    form: {
      asset_code: string
      category_bm: string
      category_en: string
      sort_order: number
      name_bm: string
      name_en: string
      description_bm: string
      description_en: string
      stock_total: number
      stock_available: number
      active: boolean
      image_url: string | null
    },
    imageFile: File | null,
    editingId: string | null,
    resetForm: () => void
  ) => {
    await runAction(async () => {
      let imageUrl = form.image_url
      if (imageFile) imageUrl = await uploadPublicFile(supabase, imageFile, 'assets')
      const payload = {
        asset_code: form.asset_code || null,
        category_bm: form.category_bm || null,
        category_en: form.category_en || null,
        sort_order: Number(form.sort_order || 1),
        name_bm: form.name_bm,
        name_en: form.name_en || null,
        description_bm: form.description_bm || null,
        description_en: form.description_en || null,
        stock_total: Number(form.stock_total),
        stock_available: Number(form.stock_available),
        active: form.active,
        image_url: imageUrl,
      }
      const query = editingId
        ? supabase.from('asset_items').update(payload).eq('id', editingId)
        : supabase.from('asset_items').insert(payload)
      const { error } = await query
      if (error) throw error
      resetForm()
    }, editingId ? 'Aset dikemas kini.' : 'Aset ditambah.')
  }

  const saveAssetCategory = async (
    form: { name_bm: string; name_en: string },
    editingId: string | null,
    resetForm: () => void
  ) => {
    await runAction(async () => {
      const payload = {
        name_bm: form.name_bm,
        name_en: form.name_en || null,
      }
      if (!isSupabaseConfigured) {
        if (editingId) {
          setAssetCategories((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c)))
        } else {
          setAssetCategories((prev) => [
            ...prev,
            { id: `cat-${Date.now()}`, ...payload, display_order: prev.length + 1 },
          ])
        }
        resetForm()
        return
      }

      const query = editingId
        ? supabase.from('asset_categories').update(payload).eq('id', editingId)
        : supabase.from('asset_categories').insert({ ...payload, display_order: assetCategories.length + 1 })
      const { error } = await query
      if (error) throw error
      resetForm()
    }, editingId ? 'Kategori aset dikemas kini.' : 'Kategori aset ditambah.')
  }

  const deleteAssetCategory = async (id: string) => {
    if (!window.confirm('Padam kategori aset ini?')) return
    await runAction(async () => {
      if (!isSupabaseConfigured) {
        setAssetCategories((prev) => prev.filter((c) => c.id !== id))
        return
      }
      const { error } = await supabase.from('asset_categories').delete().eq('id', id)
      if (error) throw error
      setAssetCategories((prev) => prev.filter((c) => c.id !== id))
    }, 'Kategori aset dipadam.')
  }

  const reorderAssets = async (reorderedList: AssetItem[]) => {
    setCatalogue(reorderedList)
    if (!isSupabaseConfigured) return
    await runAction(async () => {
      for (let i = 0; i < reorderedList.length; i++) {
        const item = reorderedList[i]
        const { error } = await supabase.from('asset_items').update({ sort_order: i + 1 }).eq('id', item.id)
        if (error) throw error
      }
    }, 'Susunan paparan aset dikemas kini.')
  }

  const saveMember = async (
    form: {
      parent_id: string
      node_type: OrganizationMember['node_type']
      node_category?: string
      name: string
      position_bm: string
      position_en: string
      unit_bm: string
      unit_en: string
      class_name: string
      duties_bm: string
      duties_en: string
      description?: string
      sort_order: number
      active: boolean
      photo_url: string | null
    },
    photoFile: File | null,
    editingId: string | null,
    resetForm: () => void
  ) => {
    await runAction(async () => {
      let photoUrl = form.photo_url
      if (photoFile) photoUrl = await uploadPublicFile(supabase, photoFile, 'organization')
      const payload = {
        parent_id: form.parent_id || null,
        node_type: form.node_type,
        node_category: form.node_category || null,
        name: form.name,
        position_bm: form.position_bm,
        position_en: form.position_en || null,
        unit_bm: form.unit_bm || null,
        unit_en: form.unit_en || null,
        class_name: form.class_name || null,
        duties_bm: form.duties_bm || null,
        duties_en: form.duties_en || null,
        description: form.description || null,
        sort_order: Number(form.sort_order),
        active: form.active,
        photo_url: photoUrl,
      }
      const query = editingId
        ? supabase.from('organization_members').update(payload).eq('id', editingId)
        : supabase.from('organization_members').insert(payload)
      const { error } = await query
      if (error) throw error
      resetForm()
    }, editingId ? 'Ahli organisasi dikemas kini.' : 'Ahli organisasi ditambah.')
  }

  const addCollection = async (form: { donor_name: string; amount: string; collected_at: string; reference_no: string; message: string }) => {
    if (!user) {
      setNotice({ type: 'danger', text: t('Sesi admin tidak ditemui.', 'Admin session not found.') })
      return
    }
    await runAction(async () => {
      const { error } = await supabase.from('donations').insert({
        user_id: user.id,
        donor_name: form.donor_name || null,
        amount: Number(form.amount),
        payment_method: 'cash',
        proof_path: null,
        reference_no: form.reference_no || null,
        message: form.message || null,
        status: 'verified',
        created_at: new Date(`${form.collected_at}T12:00:00`).toISOString(),
      })
      if (error) throw error
    }, 'Rekod kutipan ditambah dan disahkan.')
  }

  const addDisbursement = async (form: { title_bm: string; title_en: string; description_bm: string; description_en: string; amount: string; disbursed_at: string; is_public: boolean }) => {
    await runAction(async () => {
      const { error } = await supabase.from('fund_disbursements').insert({
        ...form,
        amount: Number(form.amount),
      })
      if (error) throw error
    }, 'Rekod agihan ditambah.')
  }

  const saveCmsPage = async (
    form: {
      id?: string
      title_bm: string
      title_en: string
      slug: string
      description_bm: string
      description_en: string
      status: import('../lib/types').CmsPageStatus
      is_public: boolean
      show_in_navigation: boolean
      navigation_order: number
    },
    notifySubscribers = false
  ) => {
    await runAction(async () => {
      const payload = {
        title_bm: form.title_bm,
        title_en: form.title_en || null,
        slug: form.slug,
        description_bm: form.description_bm || null,
        description_en: form.description_en || null,
        status: form.status,
        is_public: form.is_public,
        show_in_navigation: form.show_in_navigation,
        navigation_order: Number(form.navigation_order),
        created_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }

      if (!isSupabaseConfigured) {
        if (form.id) {
          setCmsPages((prev) => prev.map((p) => (p.id === form.id ? { ...p, ...payload } : p)))
        } else {
          setCmsPages((prev) => [
            ...prev,
            { ...payload, id: `mock-cms-${Date.now()}`, created_at: new Date().toISOString() },
          ])
        }
        return
      }

      const query = form.id
        ? supabase.from('cms_pages').update(payload).eq('id', form.id)
        : supabase.from('cms_pages').insert(payload)
      const { error } = await query
      if (error) throw error

      if (notifySubscribers && form.status === 'published') {
        await notifyUser(
          'all',
          'Halaman Baharu Diterbitkan',
          `Maklumat baharu telah diterbitkan: ${form.title_bm}`,
          'cms_page',
          form.slug
        )
      }
    }, form.id ? 'Halaman CMS dikemas kini.' : 'Halaman CMS dicipta.')
  }

  const deleteCmsPage = async (id: string, title: string) => {
    if (!window.confirm(`Padam halaman CMS "${title}"?`)) return
    await runAction(async () => {
      if (!isSupabaseConfigured) {
        setCmsPages((prev) => prev.filter((p) => p.id !== id))
        setCmsBlocks((prev) => prev.filter((b) => b.page_id !== id))
        return
      }
      const { error } = await supabase.from('cms_pages').delete().eq('id', id)
      if (error) throw error
      setCmsPages((prev) => prev.filter((p) => p.id !== id))
      setCmsBlocks((prev) => prev.filter((b) => b.page_id !== id))
    }, 'Halaman CMS dipadam.')
  }

  const saveCmsBlocks = async (pageId: string, blocksList: import('../lib/types').CmsPageBlock[]) => {
    await runAction(async () => {
      if (!isSupabaseConfigured) {
        setCmsBlocks((prev) => [
          ...prev.filter((b) => b.page_id !== pageId),
          ...blocksList.map((b, idx) => ({ ...b, display_order: idx + 1 })),
        ])
        return
      }

      // Delete existing blocks for this page
      const { error: delError } = await supabase.from('cms_page_blocks').delete().eq('page_id', pageId)
      if (delError) throw delError

      // Insert new blocks
      if (blocksList.length > 0) {
        const payload = blocksList.map((b, idx) => ({
          page_id: pageId,
          block_type: b.block_type,
          content: b.content,
          display_order: idx + 1,
        }))
        const { error: insError } = await supabase.from('cms_page_blocks').insert(payload)
        if (insError) throw insError
      }
    }, 'Blok kandungan disimpan.')
  }

  const saveDonationSettings = async (qrFile: File | null) => {
    if (!donationSettings) return
    await runAction(async () => {
      let qrUrl = donationSettings.qr_url
      if (qrFile) qrUrl = await uploadPublicFile(supabase, qrFile, 'donation')
      const { error } = await supabase.from('donation_settings').upsert({ ...donationSettings, id: 1, qr_url: qrUrl })
      if (error) throw error
    }, 'Maklumat Tabung Jumaat dikemas kini.')
  }

  const deleteRow = async (table: string, id: string, label: string) => {
    if (!window.confirm(`Padam ${label}?`)) return
    await runAction(async () => {
      if (!isSupabaseConfigured) {
        if (table === 'ikes_applications') setIkes((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'asset_applications') setAssetRequests((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'donations') setDonations((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'announcements') setAnnouncements((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'asset_items') setCatalogue((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'organization_members') setMembers((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'fund_disbursements') setDisbursements((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'booking_services') setBookingServices((rows) => rows.filter((r) => r.id !== id))
        else if (table === 'room_bookings') setRoomBookings((rows) => rows.filter((r) => r.id !== id))
        return
      }

      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error

      if (table === 'ikes_applications') setIkes((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'asset_applications') setAssetRequests((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'donations') setDonations((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'announcements') setAnnouncements((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'asset_items') setCatalogue((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'organization_members') setMembers((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'fund_disbursements') setDisbursements((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'booking_services') setBookingServices((rows) => rows.filter((r) => r.id !== id))
      else if (table === 'room_bookings') setRoomBookings((rows) => rows.filter((r) => r.id !== id))
    }, `${label} dipadam.`)
  }

  const markNotificationRead = async (id: string) => {
    await runAction(async () => {
      if (!isSupabaseConfigured) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        return
      }
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      if (error) throw error
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }, 'Notifikasi ditanda dibaca.')
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id)
    }
    setNotifOpen(false)

    const type = notif.notification_type?.toLowerCase() || ''
    const title = notif.title?.toLowerCase() || ''

    if (type.includes('asset') || type.includes('e_aset') || title.includes('aset')) {
      setTab('assets-requests')
    } else if (type.includes('kpk') || title.includes('kpk')) {
      setTab('kpk')
    } else if (type.includes('tempahan') || title.includes('tempahan') || title.includes('bilik')) {
      setTab('tempahan')
    } else if (type.includes('ikes') || title.includes('ikes')) {
      setTab('ikes')
    } else if (type.includes('donation') || type.includes('tabung') || title.includes('derma') || title.includes('tabung')) {
      setTab('donations')
    } else if (type.includes('announcement') || title.includes('pengumuman')) {
      setTab('announcements')
    } else if (type.includes('cms') || title.includes('halaman') || title.includes('cms')) {
      setTab('cms')
    }
  }

  const clearAllNotifications = async () => {
    await runAction(async () => {
      if (!isSupabaseConfigured) {
        setNotifications([])
        return
      }
      const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      setNotifications([])
    }, 'Semua notifikasi dibersihkan.')
  }

  if (loading) return <section className="section"><div className="container"><LoadingBlock label="Memuatkan panel pentadbir…" /></div></section>

  const pendingIkesCount = ikes.filter((i) => i.status === 'pending').length
  const pendingKpkCount = kpkApplications.filter((k) => k.status === 'pending').length
  const pendingTempahanCount = roomBookings.filter((b) => b.status === 'pending').length
  const pendingAssetsCount = assetRequests.filter((a) => a.status === 'pending').length
  const pendingDonationsCount = donations.filter((d) => d.status === 'pending').length
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: t('Ringkasan', 'Overview') },
    { id: 'ikes', label: `iKES (${pendingIkesCount})` },
    { id: 'kpk', label: `KPK+ (${pendingKpkCount})` },
    { id: 'tempahan', label: `Tempahan (${pendingTempahanCount})` },
    { id: 'assets-requests', label: `${t('Permohonan Aset', 'Asset Requests')} (${pendingAssetsCount})` },
    { id: 'donations', label: `${t('Derma', 'Donations')} (${pendingDonationsCount})` },
    { id: 'announcements', label: t('Pengumuman', 'Announcements') },
    { id: 'catalogue', label: t('Katalog Aset', 'Asset Catalogue') },
    { id: 'organization', label: t('Organisasi', 'Organisation') },
    { id: 'fund', label: t('Tabung', 'Fund') },
    { id: 'cms', label: `CMS (${cmsPages.length})` },
    { id: 'site', label: t('Identiti & Kandungan', 'Identity & Content') },
  ]

  return (
    <section className="section admin-section">
      <div className="container">
        <PageHeader
          eyebrow="ADMIN"
          title={t('Dashboard Pentadbir HiPER', 'HiPER Admin Dashboard')}
          description={t(
            'Pusat kawalan permohonan, kandungan dan rekod kewangan HiPER.',
            'Central control for HiPER applications, content and financial records.'
          )}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
              <button
                type="button"
                className="admin-notif-bell-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label={t('Notifikasi', 'Notifications')}
                title={t('Notifikasi', 'Notifications')}
              >
                <Icon name="bell" size={20} />
                {unreadNotifsCount > 0 && <span className="admin-notif-badge">{unreadNotifsCount}</span>}
              </button>
              {notifOpen && (
                <AdminNotificationDropdown
                  notifications={notifications}
                  language={language}
                  t={t}
                  onNotificationClick={handleNotificationClick}
                  onClearAll={clearAllNotifications}
                  onClose={() => setNotifOpen(false)}
                />
              )}
              <Button variant="secondary" onClick={() => void loadAll()} disabled={loading || busy} className="admin-v2-refresh-btn">
                <Icon name="refresh" size={18} />
                {t('Muat semula', 'Refresh')}
              </Button>
            </div>
          }
        />
        {premiumDbReady === false && (
          <Notice type="warning">
            {t(
              'Pangkalan data HiPER Premium belum lengkap. Jalankan fail SUPABASE-ONE-TIME-REPAIR.sql dan migration 20260808000000_phase1_upgrades.sql di Supabase SQL Editor.',
              'The HiPER Premium database upgrade is incomplete. Run SUPABASE-ONE-TIME-REPAIR.sql and migration 20260808000000_phase1_upgrades.sql in the Supabase SQL Editor.'
            )}
          </Notice>
        )}
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
        <div className="admin-tabs">
          {tabs.map((item) => (
            <Button key={item.id} variant={tab === item.id ? 'primary' : 'ghost'} onClick={() => setTab(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>

        {tab === 'overview' && (
          <AdminOverview
            language={language}
            t={t}
            ikes={ikes}
            kpk={kpkApplications}
            assetRequests={assetRequests}
            donations={donations}
            announcements={announcements}
            catalogue={catalogue}
            members={members}
            disbursements={disbursements}
            unreadNotificationsCount={unreadNotifsCount}
            onNavigateTab={setTab}
            onOpenNotificationsPopup={() => setNotifOpen(true)}
          />
        )}

        {tab === 'ikes' && (
          <AdminIkes
            t={t}
            language={language}
            ikes={ikes}
            busy={busy}
            supabaseClient={supabase}
            setIkes={setIkes}
            onUpdateIkes={updateIkes}
          />
        )}

        {tab === 'kpk' && (
          <AdminKpk
            t={t}
            language={language}
            applications={kpkApplications}
            bureaus={kpkBureaus}
            busy={busy}
            supabaseClient={supabase}
            setApplications={setKpkApplications}
            setBureaus={setKpkBureaus}
            onUpdateApplication={updateKpkApplication}
            onSaveBureau={saveKpkBureau}
            onDeleteBureau={(id) => deleteRow('kpk_bureaus', id, t('Biro Angkat', 'Bureau'))}
          />
        )}

        {tab === 'tempahan' && (
          <AdminTempahan
            t={t}
            language={language}
            services={bookingServices}
            roomBookings={roomBookings}
            busy={busy}
            supabaseClient={supabase}
            setServices={setBookingServices}
            setRoomBookings={setRoomBookings}
            onSaveService={saveBookingService}
            onDeleteService={(id) => deleteRow('booking_services', id, t('perkhidmatan tempahan', 'booking service'))}
            onUpdateRoomBooking={updateRoomBooking}
            onDeleteRoomBooking={(id) => deleteRow('room_bookings', id, t('tempahan bilik', 'room booking'))}
          />
        )}

        {tab === 'assets-requests' && (
          <AdminAssets
            t={t}
            language={language}
            mode="requests"
            assetRequests={assetRequests}
            catalogue={catalogue}
            busy={busy}
            setAssetRequests={setAssetRequests}
            onUpdateAssetRequest={updateAssetRequest}
            onSaveAsset={saveAsset}
            onDeleteAsset={(id) => deleteRow('asset_items', id, t('aset', 'asset'))}
          />
        )}

        {tab === 'catalogue' && (
          <AdminAssets
            t={t}
            language={language}
            mode="catalogue"
            assetRequests={assetRequests}
            catalogue={catalogue}
            categories={assetCategories}
            busy={busy}
            setAssetRequests={setAssetRequests}
            onUpdateAssetRequest={updateAssetRequest}
            onSaveAsset={saveAsset}
            onDeleteAsset={(id) => deleteRow('asset_items', id, t('aset', 'asset'))}
            onSaveCategory={saveAssetCategory}
            onDeleteCategory={deleteAssetCategory}
            onReorderCatalogue={reorderAssets}
          />
        )}

        {tab === 'donations' && (
          <AdminDonations
            t={t}
            language={language}
            mode="donations"
            donations={donations}
            disbursements={disbursements}
            donationSettings={donationSettings}
            busy={busy}
            supabaseClient={supabase}
            setDonations={setDonations}
            setDonationSettings={setDonationSettings}
            onUpdateDonation={updateDonation}
            onAddCollection={addCollection}
            onAddDisbursement={addDisbursement}
            onSaveDonationSettings={saveDonationSettings}
            onDeleteRow={deleteRow}
          />
        )}

        {tab === 'fund' && (
          <AdminDonations
            t={t}
            language={language}
            mode="fund"
            donations={donations}
            disbursements={disbursements}
            donationSettings={donationSettings}
            busy={busy}
            supabaseClient={supabase}
            setDonations={setDonations}
            setDonationSettings={setDonationSettings}
            onUpdateDonation={updateDonation}
            onAddCollection={addCollection}
            onAddDisbursement={addDisbursement}
            onSaveDonationSettings={saveDonationSettings}
            onDeleteRow={deleteRow}
          />
        )}

        {tab === 'announcements' && (
          <AdminAnnouncements
            t={t}
            language={language}
            announcements={announcements}
            busy={busy}
            onSaveAnnouncement={saveAnnouncement}
            onDeleteAnnouncement={(id) => deleteRow('announcements', id, t('pengumuman', 'announcement'))}
          />
        )}

        {tab === 'organization' && (
          <AdminOrganization
            t={t}
            language={language}
            members={members}
            busy={busy}
            onSaveMember={saveMember}
            onDeleteMember={(id) => deleteRow('organization_members', id, t('ahli', 'member'))}
          />
        )}

        {tab === 'cms' && (
          <AdminCMS
            t={t}
            language={language}
            pages={cmsPages}
            blocks={cmsBlocks}
            busy={busy}
            supabaseClient={supabase}
            setPages={setCmsPages}
            setBlocks={setCmsBlocks}
            onSavePage={saveCmsPage}
            onDeletePage={deleteCmsPage}
            onSaveBlocks={saveCmsBlocks}
          />
        )}

        {tab === 'site' && <SiteSettingsEditor />}
      </div>
    </section>
  )
}
