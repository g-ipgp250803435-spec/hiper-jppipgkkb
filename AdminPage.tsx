import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, LoadingBlock, Notice, PageHeader, StatCard, StatusBadge } from '../components/UI'
import { Icon } from '../components/Icons'
import { RichTextEditor, richTextToPlainText } from '../components/RichText'
import SiteSettingsEditor from '../components/admin/SiteSettingsEditor'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { isSupabaseConfigured } from '../lib/config'
import { formatDate, formatMoney, openPrivateFile, uploadPublicFile } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import type {
  Announcement,
  AssetApplication,
  AssetItem,
  Donation,
  DonationSettings,
  FundDisbursement,
  IkesApplication,
  OrganizationMember,
  RequestStatus,
} from '../lib/types'

type AdminTab = 'overview' | 'ikes' | 'assets-requests' | 'donations' | 'announcements' | 'catalogue' | 'organization' | 'fund' | 'site'

const initialAnnouncement = { title_bm: '', title_en: '', content_bm: '', content_en: '', published: true, pinned: false, poster_url: null as string | null }
const initialAsset = { asset_code: '', category_bm: 'Aset', category_en: 'Asset', sort_order: 1, name_bm: '', name_en: '', description_bm: '', description_en: '', stock_total: 1, stock_available: 1, active: true, image_url: null as string | null }
const initialMember = { parent_id: '', node_type: 'member' as OrganizationMember['node_type'], name: '', position_bm: '', position_en: '', unit_bm: '', unit_en: '', class_name: '', duties_bm: '', duties_en: '', sort_order: 1, active: true, photo_url: null as string | null }
const initialDisbursement = { title_bm: '', title_en: '', description_bm: '', description_en: '', amount: '', disbursed_at: new Date().toISOString().slice(0, 10), is_public: true }
const initialCollection = { donor_name: '', amount: '', collected_at: new Date().toISOString().slice(0, 10), reference_no: '', message: '' }

export default function AdminPage() {
  const { language, t } = useUi()
  const { user } = useAuth()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [ikes, setIkes] = useState<IkesApplication[]>([])
  const [assetRequests, setAssetRequests] = useState<AssetApplication[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [catalogue, setCatalogue] = useState<AssetItem[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [disbursements, setDisbursements] = useState<FundDisbursement[]>([])
  const [donationSettings, setDonationSettings] = useState<DonationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [announcementForm, setAnnouncementForm] = useState(initialAnnouncement)
  const [announcementPoster, setAnnouncementPoster] = useState<File | null>(null)
  const [assetForm, setAssetForm] = useState(initialAsset)
  const [assetImage, setAssetImage] = useState<File | null>(null)
  const [memberForm, setMemberForm] = useState(initialMember)
  const [memberPhoto, setMemberPhoto] = useState<File | null>(null)
  const [disbursementForm, setDisbursementForm] = useState(initialDisbursement)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [collectionForm, setCollectionForm] = useState(initialCollection)

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
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-ikes-2',
          user_id: 'mock-user-2',
          applicant_name: 'Aishah Binti Ahmad',
          class_name: 'PISMP SEJ SK',
          phone: '019-8765432',
          ikes_type: 'go_home',
          amount: 100,
          reason: 'Balik hujung minggu kecemasan.',
          ticket_path: null,
          status: 'approved',
          admin_notes: 'Diluluskan oleh pengerusi.',
          repayment_due_at: new Date(Date.now() + 3600000 * 24 * 7).toISOString(),
          repaid_at: null,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      setAssetRequests([
        {
          id: 'mock-asset-1',
          user_id: 'mock-user-3',
          applicant_name: 'Tan Wei Jin',
          class_name: 'PISMP BC SJKC',
          phone: '012-3456789',
          asset_id: 'mock-item-1',
          quantity: 2,
          borrow_date: new Date(Date.now() + 3600000 * 24).toISOString(),
          return_date: new Date(Date.now() + 3600000 * 48).toISOString(),
          purpose: 'Latihan sukan tahunan.',
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
            image_url: null
          }
        }
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
          updated_at: new Date().toISOString()
        }
      ])
      setAnnouncements([
        {
          id: 'mock-ann-1',
          title_bm: 'Gotong-Royong Perdana Asrama',
          title_en: 'Grand Hostel Cleaning Campaign',
          content_bm: 'Semua siswa guru dijemput hadir.',
          content_en: 'All student teachers are invited.',
          poster_url: null,
          published: false,
          pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      setCatalogue([
        {
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
          image_url: null
        }
      ])
      setMembers([
        {
          id: 'mock-member-1',
          parent_id: null,
          node_type: 'leadership',
          sort_order: 1,
          name: 'Encik Ahmad Bin Ali',
          position_bm: 'Pengerusi PBAK',
          position_en: 'PBAK Chairman',
          unit_bm: 'Pentadbiran',
          unit_en: 'Administration',
          class_name: 'Jabatan Hal Ehwal Pelajar',
          duties_bm: 'Penyelaras program',
          duties_en: 'Program coordinator',
          photo_url: null,
          active: true
        }
      ])
      setDisbursements([
        {
          id: 'mock-disb-1',
          title_bm: 'Bantuan Kebajikan Ramadhan',
          title_en: 'Ramadhan Welfare Aid',
          description_bm: 'Sumbangan makanan asnaf.',
          description_en: 'Asnaf food package donation.',
          amount: 500,
          disbursed_at: new Date().toISOString(),
          is_public: true,
          created_at: new Date().toISOString()
        }
      ])
      setDonationSettings({
        id: 1,
        bank_name: 'Bank Islam Malaysia Berhad',
        account_name: 'PBAK IPG KKB',
        account_number: '03018010012345',
        qr_url: null,
        note_bm: 'Sila sertakan rujukan "PBAK".',
        note_en: 'Please include reference "PBAK".',
        updated_at: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    try {
      const results = await Promise.all([
        supabase.from('ikes_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('asset_applications').select('*, asset_items(*)').order('created_at', { ascending: false }),
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('asset_items').select('*').order('name_bm'),
        supabase.from('organization_members').select('*').order('sort_order'),
        supabase.from('fund_disbursements').select('*').order('disbursed_at', { ascending: false }),
        supabase.from('donation_settings').select('*').eq('id', 1).maybeSingle(),
      ])
      const firstError = results.find((result) => result.error)?.error
      if (firstError) setNotice({ type: 'danger', text: firstError.message })
      setIkes((results[0].data as IkesApplication[]) || [])
      setAssetRequests((results[1].data as AssetApplication[]) || [])
      setDonations((results[2].data as Donation[]) || [])
      setAnnouncements((results[3].data as Announcement[]) || [])
      setCatalogue((results[4].data as AssetItem[]) || [])
      setMembers((results[5].data as OrganizationMember[]) || [])
      setDisbursements((results[6].data as FundDisbursement[]) || [])
      setDonationSettings((results[7].data as DonationSettings | null) || null)
    } catch (err) {
      setNotice({
        type: 'danger',
        text: err instanceof Error ? err.message : 'Gagal memuatkan data dari pangkalan data.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const counts = useMemo(() => {
    const pendingIkes = ikes.filter((item) => item.status === 'pending').length
    const pendingAssets = assetRequests.filter((item) => item.status === 'pending').length
    const pendingDonations = donations.filter((item) => item.status === 'pending').length
    const verifiedDonations = donations.filter((item) => item.status === 'verified').reduce((sum, item) => sum + Number(item.amount), 0)

    const totalPending = pendingIkes + pendingAssets + pendingDonations
    const lowStockAssets = catalogue.filter(
      (item) => item.active && item.stock_available <= Math.max(1, Math.ceil(item.stock_total * 0.2))
    ).length
    const unpublishedAnnouncements = announcements.filter((item) => !item.published).length

    return {
      pendingIkes,
      pendingAssets,
      pendingDonations,
      verifiedDonations,
      totalPending,
      lowStockAssets,
      unpublishedAnnouncements,
    }
  }, [ikes, assetRequests, donations, catalogue, announcements])

  const recentActivity = useMemo(() => {
    const ikesAct = ikes.map(item => ({
      id: item.id,
      type: 'ikes',
      name: item.applicant_name,
      status: item.status,
      created_at: item.created_at,
      tab: 'ikes' as AdminTab,
      detail: item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'
    }))
    const assetAct = assetRequests.map(item => ({
      id: item.id,
      type: 'asset',
      name: item.applicant_name,
      status: item.status,
      created_at: item.created_at,
      tab: 'assets-requests' as AdminTab,
      detail: language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm
    }))
    const donationAct = donations.map(item => ({
      id: item.id,
      type: 'donation',
      name: item.donor_name || (language === 'bm' ? 'Tanpa nama' : 'Anonymous'),
      status: item.status,
      created_at: item.created_at,
      tab: 'donations' as AdminTab,
      detail: formatMoney(item.amount)
    }))

    const combined = [...ikesAct, ...assetAct, ...donationAct]
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return combined.slice(0, 6)
  }, [ikes, assetRequests, donations, language])

  useEffect(() => {
    setSearchQuery('')
    setStatusFilter('all')
  }, [tab])

  const filteredIkes = useMemo(() => {
    return ikes.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchName = item.applicant_name?.toLowerCase().includes(query)
        const matchClass = item.class_name?.toLowerCase().includes(query)
        const matchPhone = item.phone?.toLowerCase().includes(query)
        const matchReason = item.reason?.toLowerCase().includes(query)
        const matchType = item.ikes_type?.toLowerCase().includes(query)
        return matchName || matchClass || matchPhone || matchReason || matchType
      }
      return true
    })
  }, [ikes, searchQuery, statusFilter])

  const filteredAssetRequests = useMemo(() => {
    return assetRequests.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchName = item.applicant_name?.toLowerCase().includes(query)
        const matchClass = item.class_name?.toLowerCase().includes(query)
        const matchPhone = item.phone?.toLowerCase().includes(query)
        const matchPurpose = item.purpose?.toLowerCase().includes(query)
        const matchAssetBm = item.asset_items?.name_bm?.toLowerCase().includes(query)
        const matchAssetEn = item.asset_items?.name_en?.toLowerCase().includes(query)
        return matchName || matchClass || matchPhone || matchPurpose || !!matchAssetBm || !!matchAssetEn
      }
      return true
    })
  }, [assetRequests, searchQuery, statusFilter])

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchDonor = item.donor_name?.toLowerCase().includes(query)
        const matchRef = item.reference_no?.toLowerCase().includes(query)
        const matchMsg = item.message?.toLowerCase().includes(query)
        const matchMethod = item.payment_method?.toLowerCase().includes(query)
        return matchDonor || matchRef || matchMsg || matchMethod
      }
      return true
    })
  }, [donations, searchQuery, statusFilter])

  const runAction = async (action: () => Promise<void>, successText: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await action()
      setNotice({ type: 'success', text: successText })
      await loadAll()
    } catch (error) {
      setNotice({ type: 'danger', text: error instanceof Error ? error.message : 'Tindakan gagal.' })
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
    }, 'Permohonan iKES dikemas kini.')
  }

  const updateAssetRequest = async (item: AssetApplication) => {
    await runAction(async () => {
      const { error } = await supabase.from('asset_applications').update({
        status: item.status,
        admin_notes: item.admin_notes,
        returned_at: item.returned_at || null,
      }).eq('id', item.id)
      if (error) throw error
    }, 'Permohonan e-Aset dikemas kini.')
  }

  const updateDonation = async (item: Donation) => {
    await runAction(async () => {
      const { error } = await supabase.from('donations').update({ status: item.status }).eq('id', item.id)
      if (error) throw error
    }, 'Rekod derma dikemas kini.')
  }

  const resetAnnouncementEditor = () => {
    setAnnouncementForm(initialAnnouncement)
    setAnnouncementPoster(null)
    setEditingAnnouncementId(null)
  }

  const startAnnouncementEdit = (item: Announcement) => {
    setAnnouncementForm({
      title_bm: item.title_bm,
      title_en: item.title_en || '',
      content_bm: item.content_bm,
      content_en: item.content_en || '',
      published: item.published,
      pinned: item.pinned,
      poster_url: item.poster_url,
    })
    setAnnouncementPoster(null)
    setEditingAnnouncementId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveAnnouncement = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      let posterUrl = announcementForm.poster_url
      if (announcementPoster) posterUrl = await uploadPublicFile(supabase, announcementPoster, 'announcements')
      const payload = {
        title_bm: announcementForm.title_bm,
        title_en: announcementForm.title_en || null,
        content_bm: announcementForm.content_bm,
        content_en: announcementForm.content_en || null,
        published: announcementForm.published,
        pinned: announcementForm.pinned,
        poster_url: posterUrl,
      }
      const query = editingAnnouncementId
        ? supabase.from('announcements').update(payload).eq('id', editingAnnouncementId)
        : supabase.from('announcements').insert(payload)
      const { error } = await query
      if (error) throw error
      resetAnnouncementEditor()
    }, editingAnnouncementId ? 'Pengumuman dikemas kini.' : 'Pengumuman ditambah.')
  }

  const resetAssetEditor = () => {
    setAssetForm(initialAsset)
    setAssetImage(null)
    setEditingAssetId(null)
  }

  const startAssetEdit = (item: AssetItem) => {
    setAssetForm({
      asset_code: item.asset_code || '',
      category_bm: item.category_bm || 'Aset',
      category_en: item.category_en || 'Asset',
      sort_order: item.sort_order || 1,
      name_bm: item.name_bm,
      name_en: item.name_en || '',
      description_bm: item.description_bm || '',
      description_en: item.description_en || '',
      stock_total: item.stock_total,
      stock_available: item.stock_available,
      active: item.active,
      image_url: item.image_url,
    })
    setAssetImage(null)
    setEditingAssetId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveAsset = async (event: FormEvent) => {
    event.preventDefault()
    if (assetForm.stock_available > assetForm.stock_total) {
      setNotice({ type: 'danger', text: t('Stok tersedia tidak boleh melebihi jumlah stok.', 'Available stock cannot exceed total stock.') })
      return
    }
    await runAction(async () => {
      let imageUrl = assetForm.image_url
      if (assetImage) imageUrl = await uploadPublicFile(supabase, assetImage, 'assets')
      const payload = {
        asset_code: assetForm.asset_code || null,
        category_bm: assetForm.category_bm || null,
        category_en: assetForm.category_en || null,
        sort_order: Number(assetForm.sort_order),
        name_bm: assetForm.name_bm,
        name_en: assetForm.name_en || null,
        description_bm: assetForm.description_bm || null,
        description_en: assetForm.description_en || null,
        stock_total: Number(assetForm.stock_total),
        stock_available: Number(assetForm.stock_available),
        active: assetForm.active,
        image_url: imageUrl,
      }
      const query = editingAssetId
        ? supabase.from('asset_items').update(payload).eq('id', editingAssetId)
        : supabase.from('asset_items').insert(payload)
      const { error } = await query
      if (error) throw error
      resetAssetEditor()
    }, editingAssetId ? 'Aset dikemas kini.' : 'Aset ditambah.')
  }

  const resetMemberEditor = () => {
    setMemberForm(initialMember)
    setMemberPhoto(null)
    setEditingMemberId(null)
  }

  const startMemberEdit = (item: OrganizationMember) => {
    setMemberForm({
      parent_id: item.parent_id || '',
      node_type: item.node_type,
      name: item.name,
      position_bm: item.position_bm,
      position_en: item.position_en || '',
      unit_bm: item.unit_bm || '',
      unit_en: item.unit_en || '',
      class_name: item.class_name || '',
      duties_bm: item.duties_bm || '',
      duties_en: item.duties_en || '',
      sort_order: item.sort_order,
      active: item.active,
      photo_url: item.photo_url,
    })
    setMemberPhoto(null)
    setEditingMemberId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveMember = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      let photoUrl = memberForm.photo_url
      if (memberPhoto) photoUrl = await uploadPublicFile(supabase, memberPhoto, 'organization')
      const payload = {
        parent_id: memberForm.parent_id || null,
        node_type: memberForm.node_type,
        name: memberForm.name,
        position_bm: memberForm.position_bm,
        position_en: memberForm.position_en || null,
        unit_bm: memberForm.unit_bm || null,
        unit_en: memberForm.unit_en || null,
        class_name: memberForm.class_name || null,
        duties_bm: memberForm.duties_bm || null,
        duties_en: memberForm.duties_en || null,
        sort_order: Number(memberForm.sort_order),
        active: memberForm.active,
        photo_url: photoUrl,
      }
      const query = editingMemberId
        ? supabase.from('organization_members').update(payload).eq('id', editingMemberId)
        : supabase.from('organization_members').insert(payload)
      const { error } = await query
      if (error) throw error
      resetMemberEditor()
    }, editingMemberId ? 'Ahli organisasi dikemas kini.' : 'Ahli organisasi ditambah.')
  }

  const addCollection = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) {
      setNotice({ type: 'danger', text: t('Sesi admin tidak ditemui. Sila log masuk semula.', 'Admin session not found. Please sign in again.') })
      return
    }
    const amount = Number(collectionForm.amount)
    if (amount <= 0) {
      setNotice({ type: 'danger', text: t('Amaun kutipan mestilah melebihi RM0.', 'Collection amount must be greater than RM0.') })
      return
    }
    await runAction(async () => {
      // Migration Premium V2 adds an admin-only INSERT policy so a manual
      // cash collection is created as verified in one atomic operation.
      const { error: insertError } = await supabase.from('donations').insert({
        user_id: user.id,
        donor_name: collectionForm.donor_name || null,
        amount,
        payment_method: 'cash',
        proof_path: null,
        reference_no: collectionForm.reference_no || null,
        message: collectionForm.message || null,
        status: 'verified',
        created_at: new Date(`${collectionForm.collected_at}T12:00:00`).toISOString(),
      })
      if (insertError) throw insertError

      setCollectionForm(initialCollection)
    }, 'Rekod kutipan ditambah dan disahkan.')
  }

  const addDisbursement = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      const { error } = await supabase.from('fund_disbursements').insert({
        ...disbursementForm,
        amount: Number(disbursementForm.amount),
      })
      if (error) throw error
      setDisbursementForm(initialDisbursement)
    }, 'Rekod agihan ditambah.')
  }

  const saveDonationSettings = async (event: FormEvent) => {
    event.preventDefault()
    if (!donationSettings) return
    await runAction(async () => {
      let qrUrl = donationSettings.qr_url
      if (qrFile) qrUrl = await uploadPublicFile(supabase, qrFile, 'donation')
      const { error } = await supabase.from('donation_settings').upsert({ ...donationSettings, id: 1, qr_url: qrUrl })
      if (error) throw error
      setQrFile(null)
    }, 'Maklumat Tabung Jumaat dikemas kini.')
  }

  const deleteRow = async (table: string, id: string, label: string) => {
    if (!window.confirm(`Padam ${label}?`)) return
    await runAction(async () => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    }, `${label} dipadam.`)
  }

  if (loading) return <section className="section"><div className="container"><LoadingBlock label="Memuatkan panel pentadbir…" /></div></section>

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: t('Ringkasan', 'Overview') },
    { id: 'ikes', label: `iKES (${counts.pendingIkes})` },
    { id: 'assets-requests', label: `${t('Permohonan Aset', 'Asset Requests')} (${counts.pendingAssets})` },
    { id: 'donations', label: `${t('Derma', 'Donations')} (${counts.pendingDonations})` },
    { id: 'announcements', label: t('Pengumuman', 'Announcements') },
    { id: 'catalogue', label: t('Katalog Aset', 'Asset Catalogue') },
    { id: 'organization', label: t('Organisasi', 'Organisation') },
    { id: 'fund', label: t('Tabung', 'Fund') },
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
            <Button variant="secondary" onClick={() => void loadAll()} disabled={loading || busy} className="admin-v2-refresh-btn">
              <Icon name="refresh" size={18} />
              {t('Muat semula', 'Refresh')}
            </Button>
          }
        />
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
        <div className="admin-tabs">
          {tabs.map((item) => <Button key={item.id} variant={tab === item.id ? 'primary' : 'ghost'} onClick={() => setTab(item.id)}>{item.label}</Button>)}
        </div>

        {tab === 'overview' && (
          <>
            <div className="stats-grid admin-v2-stats-grid">
              <StatCard label={t('Jumlah tindakan menunggu', 'Total pending actions')} value={String(counts.totalPending)} />
              <StatCard label={t('iKES menunggu', 'Pending iKES')} value={String(counts.pendingIkes)} />
              <StatCard label={t('e-Aset menunggu', 'Pending e-Asset')} value={String(counts.pendingAssets)} />
              <StatCard label={t('Derma menunggu', 'Pending donations')} value={String(counts.pendingDonations)} />
              <StatCard label={t('Derma disahkan', 'Verified donations')} value={formatMoney(counts.verifiedDonations)} />
            </div>
            <div className="admin-v2-overview-layout">
              <Card title={t('Tindakan Segera', 'Immediate Attention')} className="admin-v2-attention-card">
                <div className="admin-v2-attention-list">
                  <button onClick={() => setTab('ikes')} className="admin-v2-attention-item">
                    <span className="admin-v2-attention-count">{counts.pendingIkes}</span>
                    <span className="admin-v2-attention-label">
                      {t('Permohonan iKES Menunggu', 'Pending iKES Applications')}
                    </span>
                    <span className="admin-v2-attention-arrow"><Icon name="chevron-right" size={18} /></span>
                  </button>

                  <button onClick={() => setTab('assets-requests')} className="admin-v2-attention-item">
                    <span className="admin-v2-attention-count">{counts.pendingAssets}</span>
                    <span className="admin-v2-attention-label">
                      {t('Permohonan e-Aset Menunggu', 'Pending e-Asset Requests')}
                    </span>
                    <span className="admin-v2-attention-arrow"><Icon name="chevron-right" size={18} /></span>
                  </button>

                  <button onClick={() => setTab('donations')} className="admin-v2-attention-item">
                    <span className="admin-v2-attention-count">{counts.pendingDonations}</span>
                    <span className="admin-v2-attention-label">
                      {t('Sumbangan Perlu Pengesahan', 'Donation Verification Pending')}
                    </span>
                    <span className="admin-v2-attention-arrow"><Icon name="chevron-right" size={18} /></span>
                  </button>

                  <button onClick={() => setTab('catalogue')} className="admin-v2-attention-item admin-v2-low-stock-warning">
                    <span className={`admin-v2-attention-count ${counts.lowStockAssets > 0 ? 'admin-v2-warning-highlight' : ''}`}>{counts.lowStockAssets}</span>
                    <span className="admin-v2-attention-label">
                      {t('Aset Kurang Stok', 'Low-Stock Assets')}
                    </span>
                    <span className="admin-v2-attention-arrow"><Icon name="chevron-right" size={18} /></span>
                  </button>

                  <button onClick={() => setTab('announcements')} className="admin-v2-attention-item">
                    <span className="admin-v2-attention-count">{counts.unpublishedAnnouncements}</span>
                    <span className="admin-v2-attention-label">
                      {t('Pengumuman Belum Diterbitkan', 'Unpublished Announcements')}
                    </span>
                    <span className="admin-v2-attention-arrow"><Icon name="chevron-right" size={18} /></span>
                  </button>
                </div>
              </Card>

              <Card title={t('Aktiviti Terbaharu', 'Recent Activity')} className="admin-v2-recent-card">
                {recentActivity.length === 0 ? (
                  <EmptyState title={t('Tiada aktiviti', 'No recent activity')} />
                ) : (
                  <div className="admin-v2-recent-list">
                    {recentActivity.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="admin-v2-recent-item" onClick={() => setTab(activity.tab)} style={{ cursor: 'pointer' }}>
                        <div className="admin-v2-recent-meta-col">
                          <span className="admin-v2-recent-type">
                            {activity.type === 'ikes' && t('iKES', 'iKES')}
                            {activity.type === 'asset' && t('e-Aset', 'e-Asset')}
                            {activity.type === 'donation' && t('Derma', 'Donation')}
                          </span>
                          <span className="admin-v2-recent-name">{activity.name}</span>
                          <span className="admin-v2-recent-detail">{activity.detail}</span>
                        </div>
                        <div className="admin-v2-recent-status-col">
                          <StatusBadge status={activity.status as any} />
                          <span className="admin-v2-recent-date">{formatDate(activity.created_at, language)}</span>
                        </div>
                        <div className="admin-v2-recent-action-col">
                          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setTab(activity.tab); }} className="compact">
                            {t('Urus', 'Manage')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title={t('Ringkasan Kandungan Portal', 'Portal Content Summary')} className="admin-v2-summary-card">
                <div className="admin-v2-summary-grid">
                  <div className="admin-v2-summary-item">
                    <span className="admin-v2-summary-label">{t('Jumlah Pengumuman', 'Total Announcements')}</span>
                    <strong className="admin-v2-summary-value">{announcements.length}</strong>
                    <span className="admin-v2-summary-sub">
                      {announcements.filter(a => a.published).length} {t('Diterbitkan', 'Published')}
                    </span>
                  </div>
                  <div className="admin-v2-summary-item">
                    <span className="admin-v2-summary-label">{t('Katalog Aset', 'Asset Catalogue')}</span>
                    <strong className="admin-v2-summary-value">{catalogue.length}</strong>
                    <span className="admin-v2-summary-sub">{t('Aset aktif', 'Active assets')}</span>
                  </div>
                  <div className="admin-v2-summary-item">
                    <span className="admin-v2-summary-label">{t('Ahli Organisasi', 'Organisation Members')}</span>
                    <strong className="admin-v2-summary-value">{members.length}</strong>
                    <span className="admin-v2-summary-sub">{t('Ahli PBAK', 'PBAK members')}</span>
                  </div>
                  <div className="admin-v2-summary-item">
                    <span className="admin-v2-summary-label">{t('Rekod Agihan Dana', 'Fund Disbursement Records')}</span>
                    <strong className="admin-v2-summary-value">{disbursements.length}</strong>
                    <span className="admin-v2-summary-sub">
                      {formatMoney(disbursements.reduce((sum, d) => sum + Number(d.amount), 0))} {t('diagihkan', 'disbursed')}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === 'ikes' && (
          <Card className="table-card" title={t('Semakan permohonan iKES', 'Review iKES applications')}>
            {ikes.length > 0 && (
              <div className="admin-v2-filter-toolbar">
                <div className="admin-v2-search-wrap">
                  <Icon name="search" size={18} className="admin-v2-search-icon" />
                  <input
                    type="text"
                    className="admin-v2-search-field"
                    placeholder={t('Cari permohonan...', 'Search applications...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="admin-v2-status-wrap">
                  <select
                    className="admin-v2-status-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t('Semua Status', 'All Statuses')}</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="admin-v2-toolbar-right">
                  <span className="admin-v2-results-count">
                    {t(
                      `Menunjukkan ${filteredIkes.length} daripada ${ikes.length} rekod`,
                      `Showing ${filteredIkes.length} of ${ikes.length} records`
                    )}
                  </span>
                  {(searchQuery !== '' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      className="admin-v2-clear-btn compact"
                      onClick={() => {
                        setSearchQuery('')
                        setStatusFilter('all')
                      }}
                    >
                      {t('Kosongkan', 'Clear')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {ikes.length === 0 ? (
              <EmptyState title={t('Tiada permohonan', 'No applications')} />
            ) : filteredIkes.length === 0 ? (
              <EmptyState
                title={t('Tiada rekod sepadan', 'No matching records')}
                description={t(
                  'Tiada rekod sepadan dengan carian atau penapis.',
                  'No records match the current search or filter.'
                )}
              />
            ) : (
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Pemohon', 'Applicant')}</th>
                      <th>{t('Butiran', 'Details')}</th>
                      <th>{t('Status', 'Status')}</th>
                      <th>{t('Nota & bayaran balik', 'Notes & repayment')}</th>
                      <th>{t('Tindakan', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIkes.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.applicant_name}</strong>
                          <small>
                            {item.class_name}
                            <br />
                            {item.phone}
                            <br />
                            {formatDate(item.created_at, language)}
                          </small>
                        </td>
                        <td>
                          <strong>
                            {item.ikes_type === 'care' ? 'iKES Care' : 'iKES Go-Home'} · {formatMoney(item.amount)}
                          </strong>
                          <p>{item.reason}</p>
                          {item.ticket_path && (
                            <Button
                              variant="ghost"
                              onClick={() => void openPrivateFile(supabase, item.ticket_path!)}
                            >
                              {t('Buka resit', 'Open receipt')}
                            </Button>
                          )}
                        </td>
                        <td>
                          <select
                            value={item.status}
                            onChange={(event) =>
                              setIkes((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, status: event.target.value as RequestStatus } : row
                                )
                              )
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <StatusBadge status={item.status} />
                        </td>
                        <td>
                          <textarea
                            rows={3}
                            placeholder={t('Nota admin', 'Admin note')}
                            value={item.admin_notes || ''}
                            onChange={(event) =>
                              setIkes((rows) =>
                                rows.map((row) => (row.id === item.id ? { ...row, admin_notes: event.target.value } : row))
                              )
                            }
                          />
                          <label className="mini-field">
                            <span>{t('Tarikh akhir bayar', 'Repayment due')}</span>
                            <input
                              type="date"
                              value={item.repayment_due_at?.slice(0, 10) || ''}
                              onChange={(event) =>
                                setIkes((rows) =>
                                  rows.map((row) =>
                                    row.id === item.id
                                      ? { ...row, repayment_due_at: event.target.value || null }
                                      : row
                                  )
                                )
                              }
                            />
                          </label>
                          <label className="mini-field">
                            <span>{t('Tarikh dibayar', 'Paid date')}</span>
                            <input
                              type="date"
                              value={item.repaid_at?.slice(0, 10) || ''}
                              onChange={(event) =>
                                setIkes((rows) =>
                                  rows.map((row) =>
                                    row.id === item.id ? { ...row, repaid_at: event.target.value || null } : row
                                  )
                                )
                              }
                            />
                          </label>
                        </td>
                        <td>
                          <Button disabled={busy} onClick={() => void updateIkes(item)}>
                            {t('Simpan', 'Save')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'assets-requests' && (
          <Card className="table-card" title={t('Semakan permohonan e-Aset', 'Review e-Asset requests')}>
            {assetRequests.length > 0 && (
              <div className="admin-v2-filter-toolbar">
                <div className="admin-v2-search-wrap">
                  <Icon name="search" size={18} className="admin-v2-search-icon" />
                  <input
                    type="text"
                    className="admin-v2-search-field"
                    placeholder={t('Cari permohonan...', 'Search requests...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="admin-v2-status-wrap">
                  <select
                    className="admin-v2-status-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t('Semua Status', 'All Statuses')}</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="admin-v2-toolbar-right">
                  <span className="admin-v2-results-count">
                    {t(
                      `Menunjukkan ${filteredAssetRequests.length} daripada ${assetRequests.length} rekod`,
                      `Showing ${filteredAssetRequests.length} of ${assetRequests.length} records`
                    )}
                  </span>
                  {(searchQuery !== '' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      className="admin-v2-clear-btn compact"
                      onClick={() => {
                        setSearchQuery('')
                        setStatusFilter('all')
                      }}
                    >
                      {t('Kosongkan', 'Clear')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {assetRequests.length === 0 ? (
              <EmptyState title={t('Tiada permohonan', 'No requests')} />
            ) : filteredAssetRequests.length === 0 ? (
              <EmptyState
                title={t('Tiada rekod sepadan', 'No matching records')}
                description={t(
                  'Tiada rekod sepadan dengan carian atau penapis.',
                  'No records match the current search or filter.'
                )}
              />
            ) : (
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Pemohon', 'Applicant')}</th>
                      <th>{t('Aset & tempoh', 'Asset & period')}</th>
                      <th>{t('Status', 'Status')}</th>
                      <th>{t('Nota', 'Notes')}</th>
                      <th>{t('Tindakan', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssetRequests.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.applicant_name}</strong>
                          <small>
                            {item.class_name}
                            <br />
                            {item.phone}
                          </small>
                        </td>
                        <td>
                          <strong>
                            {language === 'bm' ? item.asset_items?.name_bm : item.asset_items?.name_en || item.asset_items?.name_bm} × {item.quantity}
                          </strong>
                          <p>
                            {formatDate(item.borrow_date, language)} – {formatDate(item.return_date, language)}
                          </p>
                          <small>{item.purpose}</small>
                        </td>
                        <td>
                          <select
                            value={item.status}
                            onChange={(event) =>
                              setAssetRequests((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, status: event.target.value as RequestStatus } : row
                                )
                              )
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <textarea
                            rows={3}
                            value={item.admin_notes || ''}
                            onChange={(event) =>
                              setAssetRequests((rows) =>
                                rows.map((row) => (row.id === item.id ? { ...row, admin_notes: event.target.value } : row))
                              )
                            }
                          />
                          <label className="mini-field">
                            <span>{t('Tarikh dipulangkan', 'Returned date')}</span>
                            <input
                              type="date"
                              value={item.returned_at?.slice(0, 10) || ''}
                              onChange={(event) =>
                                setAssetRequests((rows) =>
                                  rows.map((row) =>
                                    row.id === item.id ? { ...row, returned_at: event.target.value || null } : row
                                  )
                                )
                              }
                            />
                          </label>
                        </td>
                        <td>
                          <Button disabled={busy} onClick={() => void updateAssetRequest(item)}>
                            {t('Simpan', 'Save')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'donations' && (
          <div className="stack">
            <Card
              title={t('Tambah rekod kutipan', 'Add collection record')}
              className="admin-manual-collection-card"
            >
              <form className="form-grid" onSubmit={addCollection}>
                <Field label={t('Nama penderma / sumber', 'Donor / source name')} hint={t('Boleh dikosongkan untuk rekod tanpa nama.', 'May be left blank for an anonymous record.')}>
                  <input
                    value={collectionForm.donor_name}
                    onChange={(event) => setCollectionForm({ ...collectionForm, donor_name: event.target.value })}
                    placeholder={t('Contoh: Kutipan Jumaat Minggu 1', 'Example: Friday collection Week 1')}
                  />
                </Field>
                <Field label={t('Amaun kutipan (RM)', 'Collection amount (RM)')} required>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={collectionForm.amount}
                    onChange={(event) => setCollectionForm({ ...collectionForm, amount: event.target.value })}
                    required
                  />
                </Field>
                <Field label={t('Tarikh kutipan', 'Collection date')} required>
                  <input
                    type="date"
                    value={collectionForm.collected_at}
                    onChange={(event) => setCollectionForm({ ...collectionForm, collected_at: event.target.value })}
                    required
                  />
                </Field>
                <Field label={t('Nombor rujukan', 'Reference number')}>
                  <input
                    value={collectionForm.reference_no}
                    onChange={(event) => setCollectionForm({ ...collectionForm, reference_no: event.target.value })}
                  />
                </Field>
                <div className="full-span">
                  <Field label={t('Catatan', 'Notes')}>
                    <textarea
                      rows={3}
                      value={collectionForm.message}
                      onChange={(event) => setCollectionForm({ ...collectionForm, message: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="full-span form-actions">
                  <Button type="submit" disabled={busy}>
                    <Icon name="plus" size={18} />
                    {t('Tambah sebagai kutipan disahkan', 'Add as verified collection')}
                  </Button>
                </div>
              </form>
              <p className="admin-form-note">
                {t(
                  'Rekod ini menggunakan jadual donations sedia ada, disimpan sebagai tunai dan terus disahkan.',
                  'This uses the existing donations table, is stored as cash, and is verified immediately.'
                )}
              </p>
            </Card>

            <Card className="table-card" title={t('Pengesahan sumbangan', 'Donation verification')}>
              {donations.length > 0 && (
                <div className="admin-v2-filter-toolbar">
                  <div className="admin-v2-search-wrap">
                    <Icon name="search" size={18} className="admin-v2-search-icon" />
                    <input
                      type="text"
                      className="admin-v2-search-field"
                      placeholder={t('Cari sumbangan...', 'Search donations...')}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                  <div className="admin-v2-status-wrap">
                    <select className="admin-v2-status-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option value="all">{t('Semua status', 'All statuses')}</option>
                      <option value="pending">{t('Menunggu', 'Pending')}</option>
                      <option value="verified">{t('Disahkan', 'Verified')}</option>
                      <option value="rejected">{t('Ditolak', 'Rejected')}</option>
                    </select>
                  </div>
                  <div className="admin-v2-toolbar-right">
                    <span className="admin-v2-results-count">
                      {t(`Menunjukkan ${filteredDonations.length} daripada ${donations.length} rekod`, `Showing ${filteredDonations.length} of ${donations.length} records`)}
                    </span>
                    {(searchQuery || statusFilter !== 'all') && (
                      <Button variant="ghost" className="admin-v2-clear-btn compact" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                        {t('Kosongkan', 'Clear')}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {donations.length === 0 ? (
                <EmptyState title={t('Tiada rekod derma', 'No donation records')} />
              ) : filteredDonations.length === 0 ? (
                <EmptyState
                  title={t('Tiada rekod sepadan', 'No matching records')}
                  description={t('Tiada rekod sepadan dengan carian atau penapis.', 'No records match the current search or filter.')}
                />
              ) : (
                <div className="responsive-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('Tarikh', 'Date')}</th>
                        <th>{t('Penderma', 'Donor')}</th>
                        <th>{t('Bayaran', 'Payment')}</th>
                        <th>{t('Status', 'Status')}</th>
                        <th>{t('Tindakan', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonations.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.created_at, language)}</td>
                          <td>
                            <strong>{item.donor_name || t('Tanpa nama', 'Anonymous')}</strong>
                            <small className="preserve-lines">{item.message || '—'}</small>
                          </td>
                          <td>
                            <strong>{formatMoney(item.amount)}</strong>
                            <small>{item.payment_method.replace('_', ' ')} · {item.reference_no || '—'}</small>
                            {item.proof_path && (
                              <Button variant="ghost" onClick={() => void openPrivateFile(supabase, item.proof_path!)}>
                                {t('Buka bukti', 'Open proof')}
                              </Button>
                            )}
                          </td>
                          <td>
                            <select
                              value={item.status}
                              onChange={(event) => setDonations((rows) => rows.map((row) => row.id === item.id ? { ...row, status: event.target.value as Donation['status'] } : row))}
                            >
                              <option value="pending">{t('Menunggu', 'Pending')}</option>
                              <option value="verified">{t('Disahkan', 'Verified')}</option>
                              <option value="rejected">{t('Ditolak', 'Rejected')}</option>
                            </select>
                            <StatusBadge status={item.status} />
                          </td>
                          <td>
                            <Button disabled={busy} onClick={() => void updateDonation(item)}>
                              <Icon name="save" size={17} />
                              {t('Simpan', 'Save')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="admin-content-grid admin-editor-grid">
            <Card
              title={editingAnnouncementId ? t('Edit pengumuman', 'Edit announcement') : t('Tambah pengumuman', 'Add announcement')}
              className={editingAnnouncementId ? 'admin-editor-active' : ''}
              action={editingAnnouncementId ? <span className="editor-mode-badge"><Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}</span> : undefined}
            >
              <form className="form-grid" onSubmit={saveAnnouncement}>
                <Field label="Tajuk BM" required>
                  <input value={announcementForm.title_bm} onChange={(event) => setAnnouncementForm({ ...announcementForm, title_bm: event.target.value })} required />
                </Field>
                <Field label="English title">
                  <input value={announcementForm.title_en} onChange={(event) => setAnnouncementForm({ ...announcementForm, title_en: event.target.value })} />
                </Field>
                <div className="full-span">
                  <Field label="Kandungan BM" required hint={t('Gunakan toolbar untuk bold, italic, bullets dan numbering.', 'Use the toolbar for bold, italic, bullets and numbering.')}>
                    <RichTextEditor value={announcementForm.content_bm} onChange={(value) => setAnnouncementForm({ ...announcementForm, content_bm: value })} ariaLabel="Kandungan pengumuman Bahasa Melayu" />
                  </Field>
                </div>
                <div className="full-span">
                  <Field label="English content" hint={t('Gunakan toolbar untuk bold, italic, bullets dan numbering.', 'Use the toolbar for bold, italic, bullets and numbering.')}>
                    <RichTextEditor value={announcementForm.content_en} onChange={(value) => setAnnouncementForm({ ...announcementForm, content_en: value })} ariaLabel="English announcement content" />
                  </Field>
                </div>
                <div className="full-span">
                  <Field label={editingAnnouncementId ? t('Ganti poster', 'Replace poster') : t('Poster', 'Poster')}>
                    <input type="file" accept="image/*" onChange={(event) => setAnnouncementPoster(event.target.files?.[0] || null)} />
                  </Field>
                  {announcementForm.poster_url && !announcementPoster && (
                    <div className="admin-media-preview">
                      <img src={announcementForm.poster_url} alt="" />
                      <span>{t('Poster semasa akan dikekalkan.', 'Current poster will be retained.')}</span>
                    </div>
                  )}
                </div>
                <label className="checkbox-field">
                  <input type="checkbox" checked={announcementForm.published} onChange={(event) => setAnnouncementForm({ ...announcementForm, published: event.target.checked })} />
                  {t('Terbitkan', 'Publish')}
                </label>
                <label className="checkbox-field">
                  <input type="checkbox" checked={announcementForm.pinned} onChange={(event) => setAnnouncementForm({ ...announcementForm, pinned: event.target.checked })} />
                  {t('Sematkan', 'Pin')}
                </label>
                <div className="full-span form-actions">
                  <Button disabled={busy} type="submit">
                    <Icon name="save" size={18} />
                    {editingAnnouncementId ? t('Simpan perubahan', 'Save changes') : t('Tambah pengumuman', 'Add announcement')}
                  </Button>
                  {editingAnnouncementId && (
                    <Button type="button" variant="secondary" onClick={resetAnnouncementEditor}>
                      <Icon name="close" size={18} />
                      {t('Batal edit', 'Cancel edit')}
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <Card title={t('Senarai pengumuman', 'Announcement list')}>
              {announcements.length === 0 ? (
                <EmptyState title={t('Tiada pengumuman', 'No announcements')} />
              ) : (
                <div className="management-list">
                  {announcements.map((item) => (
                    <div className="management-item management-item-rich" key={item.id}>
                      <div className="management-thumb">
                        {item.poster_url ? <img src={item.poster_url} alt="" /> : <Icon name="image" size={24} />}
                      </div>
                      <div className="management-copy">
                        <strong>{language === 'bm' ? item.title_bm : item.title_en || item.title_bm}</strong>
                        <small>{item.published ? t('Diterbitkan', 'Published') : t('Draf', 'Draft')} · {formatDate(item.created_at, language)}</small>
                        <p className="management-excerpt">{richTextToPlainText(language === 'bm' ? item.content_bm : item.content_en || item.content_bm)}</p>
                      </div>
                      <div className="management-actions">
                        <Button variant="secondary" className="compact" onClick={() => startAnnouncementEdit(item)}>
                          <Icon name="edit" size={17} /> {t('Edit', 'Edit')}
                        </Button>
                        <Button variant="danger" className="compact" onClick={() => void deleteRow('announcements', item.id, t('pengumuman', 'announcement'))}>
                          <Icon name="trash" size={17} /> {t('Padam', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'catalogue' && (
          <div className="admin-content-grid admin-editor-grid">
            <Card
              title={editingAssetId ? t('Edit aset', 'Edit asset') : t('Tambah aset', 'Add asset')}
              className={editingAssetId ? 'admin-editor-active' : ''}
              action={editingAssetId ? <span className="editor-mode-badge"><Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}</span> : undefined}
            >
              <form className="form-grid" onSubmit={saveAsset}>
                <Field label={t('Kod aset', 'Asset code')} hint={t('Contoh: AST-001', 'Example: AST-001')}>
                  <input value={assetForm.asset_code} onChange={(event) => setAssetForm({ ...assetForm, asset_code: event.target.value.toUpperCase() })} />
                </Field>
                <Field label={t('Susunan paparan', 'Display order')} required>
                  <input type="number" min="0" value={assetForm.sort_order} onChange={(event) => setAssetForm({ ...assetForm, sort_order: Number(event.target.value) })} required />
                </Field>
                <Field label="Kategori BM">
                  <input value={assetForm.category_bm} onChange={(event) => setAssetForm({ ...assetForm, category_bm: event.target.value })} />
                </Field>
                <Field label="English category">
                  <input value={assetForm.category_en} onChange={(event) => setAssetForm({ ...assetForm, category_en: event.target.value })} />
                </Field>
                <Field label="Nama BM" required>
                  <input value={assetForm.name_bm} onChange={(event) => setAssetForm({ ...assetForm, name_bm: event.target.value })} required />
                </Field>
                <Field label="English name">
                  <input value={assetForm.name_en} onChange={(event) => setAssetForm({ ...assetForm, name_en: event.target.value })} />
                </Field>
                <Field label={t('Jumlah stok', 'Total stock')} required>
                  <input type="number" min="0" value={assetForm.stock_total} onChange={(event) => setAssetForm({ ...assetForm, stock_total: Number(event.target.value) })} required />
                </Field>
                <Field label={t('Stok tersedia', 'Available stock')} required hint={t('Tidak boleh melebihi jumlah stok.', 'Cannot exceed total stock.')}>
                  <input type="number" min="0" max={assetForm.stock_total} value={assetForm.stock_available} onChange={(event) => setAssetForm({ ...assetForm, stock_available: Number(event.target.value) })} required />
                </Field>
                <div className="full-span">
                  <Field label="Penerangan BM">
                    <textarea rows={4} value={assetForm.description_bm} onChange={(event) => setAssetForm({ ...assetForm, description_bm: event.target.value })} />
                  </Field>
                </div>
                <div className="full-span">
                  <Field label="English description">
                    <textarea rows={4} value={assetForm.description_en} onChange={(event) => setAssetForm({ ...assetForm, description_en: event.target.value })} />
                  </Field>
                </div>
                <div className="full-span">
                  <Field label={editingAssetId ? t('Ganti gambar aset', 'Replace asset image') : t('Gambar aset', 'Asset image')}>
                    <input type="file" accept="image/*" onChange={(event) => setAssetImage(event.target.files?.[0] || null)} />
                  </Field>
                  {assetForm.image_url && !assetImage && (
                    <div className="admin-media-preview">
                      <img src={assetForm.image_url} alt="" />
                      <span>{t('Gambar semasa akan dikekalkan.', 'Current image will be retained.')}</span>
                    </div>
                  )}
                </div>
                <label className="checkbox-field full-span">
                  <input type="checkbox" checked={assetForm.active} onChange={(event) => setAssetForm({ ...assetForm, active: event.target.checked })} />
                  {t('Aset aktif dan dipaparkan dalam katalog', 'Asset is active and shown in the catalogue')}
                </label>
                <div className="full-span form-actions">
                  <Button disabled={busy} type="submit">
                    <Icon name="save" size={18} />
                    {editingAssetId ? t('Simpan perubahan', 'Save changes') : t('Tambah aset', 'Add asset')}
                  </Button>
                  {editingAssetId && (
                    <Button type="button" variant="secondary" onClick={resetAssetEditor}>
                      <Icon name="close" size={18} /> {t('Batal edit', 'Cancel edit')}
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <Card title={t('Katalog semasa', 'Current catalogue')}>
              {catalogue.length === 0 ? (
                <EmptyState title={t('Tiada aset', 'No assets')} />
              ) : (
                <div className="management-list">
                  {catalogue.map((item) => (
                    <div className="management-item management-item-rich" key={item.id}>
                      <div className="management-thumb">
                        {item.image_url ? <img src={item.image_url} alt="" /> : <Icon name="box" size={24} />}
                      </div>
                      <div className="management-copy">
                        <strong>{language === 'bm' ? item.name_bm : item.name_en || item.name_bm}</strong>
                        <small>{item.stock_available}/{item.stock_total} {t('tersedia', 'available')} · {item.active ? t('Aktif', 'Active') : t('Tidak aktif', 'Inactive')}</small>
                        {(item.description_bm || item.description_en) && <p className="management-excerpt">{language === 'bm' ? item.description_bm : item.description_en || item.description_bm}</p>}
                      </div>
                      <div className="management-actions">
                        <Button variant="secondary" className="compact" onClick={() => startAssetEdit(item)}>
                          <Icon name="edit" size={17} /> {t('Edit', 'Edit')}
                        </Button>
                        <Button variant="danger" className="compact" onClick={() => void deleteRow('asset_items', item.id, t('aset', 'asset'))}>
                          <Icon name="trash" size={17} /> {t('Padam', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'organization' && (
          <div className="admin-content-grid admin-editor-grid">
            <Card
              title={editingMemberId ? t('Edit ahli organisasi', 'Edit organisation member') : t('Tambah ahli', 'Add member')}
              className={editingMemberId ? 'admin-editor-active' : ''}
              action={editingMemberId ? <span className="editor-mode-badge"><Icon name="edit" size={15} /> {t('Mod edit', 'Edit mode')}</span> : undefined}
            >
              <form className="form-grid" onSubmit={saveMember}>
                <Field label={t('Nama / nama unit', 'Name / unit name')} required>
                  <input value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} required />
                </Field>
                <Field label={t('Jenis nod', 'Node type')} required>
                  <select value={memberForm.node_type} onChange={(event) => setMemberForm({ ...memberForm, node_type: event.target.value as 'leadership' | 'unit' | 'member', parent_id: '' })}>
                    <option value="leadership">{t('Kepimpinan', 'Leadership')}</option>
                    <option value="unit">{t('Unit', 'Unit')}</option>
                    <option value="member">{t('Ahli', 'Member')}</option>
                  </select>
                </Field>
                <Field label={t('Induk dalam hierarki', 'Parent in hierarchy')} hint={t('Kosongkan untuk peringkat tertinggi.', 'Leave blank for a top-level node.')}>
                  <select value={memberForm.parent_id} onChange={(event) => setMemberForm({ ...memberForm, parent_id: event.target.value })}>
                    <option value="">{t('Tiada induk', 'No parent')}</option>
                    {members
                      .filter((member) => member.id !== editingMemberId)
                      .filter((member) => {
                        if (memberForm.node_type === 'leadership') return member.node_type === 'leadership'
                        if (memberForm.node_type === 'unit') return member.node_type === 'leadership'
                        return member.node_type === 'unit'
                      })
                      .map((member) => (
                        <option key={member.id} value={member.id}>{member.name} — {member.position_bm}</option>
                      ))}
                  </select>
                </Field>
                <Field label={t('Susunan', 'Order')} required>
                  <input type="number" min="0" value={memberForm.sort_order} onChange={(event) => setMemberForm({ ...memberForm, sort_order: Number(event.target.value) })} required />
                </Field>
                <Field label="Jawatan BM" required>
                  <input value={memberForm.position_bm} onChange={(event) => setMemberForm({ ...memberForm, position_bm: event.target.value })} required />
                </Field>
                <Field label="English position">
                  <input value={memberForm.position_en} onChange={(event) => setMemberForm({ ...memberForm, position_en: event.target.value })} />
                </Field>
                <Field label="Unit BM">
                  <input value={memberForm.unit_bm} onChange={(event) => setMemberForm({ ...memberForm, unit_bm: event.target.value })} />
                </Field>
                <Field label="English unit">
                  <input value={memberForm.unit_en} onChange={(event) => setMemberForm({ ...memberForm, unit_en: event.target.value })} />
                </Field>
                <Field label={t('Kelas', 'Class')}>
                  <input value={memberForm.class_name} onChange={(event) => setMemberForm({ ...memberForm, class_name: event.target.value })} />
                </Field>
                <Field label={editingMemberId ? t('Ganti gambar', 'Replace photo') : t('Gambar', 'Photo')}>
                  <input type="file" accept="image/*" onChange={(event) => setMemberPhoto(event.target.files?.[0] || null)} />
                </Field>
                {memberForm.photo_url && !memberPhoto && (
                  <div className="full-span admin-media-preview">
                    <img src={memberForm.photo_url} alt="" />
                    <span>{t('Gambar semasa akan dikekalkan.', 'Current photo will be retained.')}</span>
                  </div>
                )}
                <div className="full-span">
                  <Field label="Bidang tugas BM">
                    <textarea rows={4} value={memberForm.duties_bm} onChange={(event) => setMemberForm({ ...memberForm, duties_bm: event.target.value })} />
                  </Field>
                </div>
                <div className="full-span">
                  <Field label="English duties">
                    <textarea rows={4} value={memberForm.duties_en} onChange={(event) => setMemberForm({ ...memberForm, duties_en: event.target.value })} />
                  </Field>
                </div>
                <label className="checkbox-field full-span">
                  <input type="checkbox" checked={memberForm.active} onChange={(event) => setMemberForm({ ...memberForm, active: event.target.checked })} />
                  {t('Ahli aktif dan dipaparkan di halaman Kenali Pejabat', 'Active member shown on the Our Office page')}
                </label>
                <div className="full-span form-actions">
                  <Button disabled={busy} type="submit">
                    <Icon name="save" size={18} />
                    {editingMemberId ? t('Simpan perubahan', 'Save changes') : t('Tambah ahli', 'Add member')}
                  </Button>
                  {editingMemberId && (
                    <Button type="button" variant="secondary" onClick={resetMemberEditor}>
                      <Icon name="close" size={18} /> {t('Batal edit', 'Cancel edit')}
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <Card title={t('Ahli carta organisasi', 'Organisation chart members')}>
              {members.length === 0 ? (
                <EmptyState title={t('Tiada ahli organisasi', 'No organisation members')} />
              ) : (
                <div className="management-list">
                  {members.map((item) => (
                    <div className="management-item management-item-rich" key={item.id}>
                      <div className="management-thumb management-avatar">
                        {item.photo_url ? <img src={item.photo_url} alt="" /> : <Icon name="user" size={24} />}
                      </div>
                      <div className="management-copy">
                        <strong>{item.sort_order}. {item.name}</strong>
                        <small>{language === 'bm' ? item.position_bm : item.position_en || item.position_bm} · {item.class_name || '—'}</small>
                        <p className="management-excerpt">{language === 'bm' ? item.unit_bm || item.duties_bm : item.unit_en || item.unit_bm || item.duties_en || item.duties_bm}</p>
                      </div>
                      <div className="management-actions">
                        <Button variant="secondary" className="compact" onClick={() => startMemberEdit(item)}>
                          <Icon name="edit" size={17} /> {t('Edit', 'Edit')}
                        </Button>
                        <Button variant="danger" className="compact" onClick={() => void deleteRow('organization_members', item.id, t('ahli', 'member'))}>
                          <Icon name="trash" size={17} /> {t('Padam', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'site' && (
          <SiteSettingsEditor />
        )}

        {tab === 'fund'  && (
          <div className="stack">
            {donationSettings && <Card title={t('Maklumat akaun rasmi', 'Official account information')}><form className="form-grid" onSubmit={saveDonationSettings}>
              <Field label={t('Nama bank', 'Bank name')}><input value={donationSettings.bank_name || ''} onChange={(e) => setDonationSettings({ ...donationSettings, bank_name: e.target.value })} /></Field><Field label={t('Nama akaun', 'Account name')}><input value={donationSettings.account_name || ''} onChange={(e) => setDonationSettings({ ...donationSettings, account_name: e.target.value })} /></Field>
              <Field label={t('Nombor akaun', 'Account number')}><input value={donationSettings.account_number || ''} onChange={(e) => setDonationSettings({ ...donationSettings, account_number: e.target.value })} /></Field><Field label={t('Kod QR', 'QR code')}><input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} /></Field>
              <div className="full-span"><Field label="Nota BM"><textarea rows={2} value={donationSettings.note_bm || ''} onChange={(e) => setDonationSettings({ ...donationSettings, note_bm: e.target.value })} /></Field></div><div className="full-span"><Field label="English note"><textarea rows={2} value={donationSettings.note_en || ''} onChange={(e) => setDonationSettings({ ...donationSettings, note_en: e.target.value })} /></Field></div>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Simpan maklumat', 'Save information')}</Button></div>
            </form></Card>}
            <div className="admin-content-grid"><Card title={t('Tambah rekod agihan', 'Add distribution record')}><form className="form-grid" onSubmit={addDisbursement}>
              <Field label="Tajuk BM" required><input value={disbursementForm.title_bm} onChange={(e) => setDisbursementForm({ ...disbursementForm, title_bm: e.target.value })} required /></Field><Field label="English title"><input value={disbursementForm.title_en} onChange={(e) => setDisbursementForm({ ...disbursementForm, title_en: e.target.value })} /></Field>
              <Field label={t('Amaun (RM)', 'Amount (RM)')} required><input type="number" min="0.01" step="0.01" value={disbursementForm.amount} onChange={(e) => setDisbursementForm({ ...disbursementForm, amount: e.target.value })} required /></Field><Field label={t('Tarikh agihan', 'Distribution date')} required><input type="date" value={disbursementForm.disbursed_at} onChange={(e) => setDisbursementForm({ ...disbursementForm, disbursed_at: e.target.value })} required /></Field>
              <div className="full-span"><Field label="Penerangan BM"><textarea rows={3} value={disbursementForm.description_bm} onChange={(e) => setDisbursementForm({ ...disbursementForm, description_bm: e.target.value })} /></Field></div><div className="full-span"><Field label="English description"><textarea rows={3} value={disbursementForm.description_en} onChange={(e) => setDisbursementForm({ ...disbursementForm, description_en: e.target.value })} /></Field></div>
              <label className="checkbox-field full-span"><input type="checkbox" checked={disbursementForm.is_public} onChange={(e) => setDisbursementForm({ ...disbursementForm, is_public: e.target.checked })} /> {t('Paparkan kepada umum', 'Display publicly')}</label>
              <div className="full-span form-actions"><Button disabled={busy} type="submit">{t('Tambah rekod', 'Add record')}</Button></div>
            </form></Card><Card title={t('Rekod agihan', 'Distribution records')}><div className="management-list">{disbursements.map((item) => <div className="management-item" key={item.id}><div><strong>{item.title_bm} · {formatMoney(item.amount)}</strong><small>{formatDate(item.disbursed_at, language)} · {item.is_public ? t('Awam', 'Public') : t('Tersembunyi', 'Hidden')}</small></div><Button variant="danger" onClick={() => void deleteRow('fund_disbursements', item.id, 'rekod agihan')}>{t('Padam', 'Delete')}</Button></div>)}</div></Card></div>
          </div>
        )}
      </div>
    </section>
  )
}
