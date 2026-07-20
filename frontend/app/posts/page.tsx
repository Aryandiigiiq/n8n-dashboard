// ─── Unified Posts Feature Module ──────────────────────────────────────────────
// Self-contained: types, constants, API service, hooks, and UI components.

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import apiClient from '@/services/api'
import styles from './page.module.css'

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface SyncPost {
  post_id: string
  permalink: string
  platform: 'instagram' | 'facebook' | 'linkedin' | string
  caption: string | null
  media_type: string | null
  post_thumbnail: string | null
  likes: number
  comments: number
  automation_count: number
  is_active: boolean
}

export interface AutomationConfig {
  automation_enabled: boolean
  match_type: 'contains' | 'exact' | 'starts_with' | 'ends_with'
  ignore_case: boolean
  keywords: string[]
  reply_enabled: boolean
  dm_enabled: boolean
  reply_template: string
  dm_template: string
  reply_delay: number
  expires_at: string | null
  campaign_name: string
  platform_name?: string
}

export type PanelMode = 'configure' | null

export interface PanelState {
  mode: PanelMode
  postId: string | null
}

export interface PostsFilter {
  platform?: string
  campaign?: string
  search?: string
}

// ==========================================
// 2. STATIC CONSTANTS
// ==========================================

const PLATFORM_THUMBS: Record<string, string> = {
  instagram: 'https://cdn-icons-png.flaticon.com/512/174/174855.png',
  facebook: 'https://cdn-icons-png.flaticon.com/512/124/124010.png',
}

const PLATFORMS_FILTER_OPTIONS = [
  { value: '', label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
]

const DUMMY_POSTS: SyncPost[] = []

const DEFAULT_CONFIG: AutomationConfig = {
  automation_enabled: false,
  match_type: 'contains',
  ignore_case: true,
  keywords: [],
  reply_enabled: true,
  dm_enabled: true,
  reply_template: '',
  dm_template: '',
  reply_delay: 0,
  expires_at: null,
  campaign_name: '',
}

// ==========================================
// 3. API SERVICE LAYER
// ==========================================

const postsService = {
  async getPosts(filters: PostsFilter = {}): Promise<SyncPost[]> {
    const res = await apiClient.get<SyncPost[]>('/posts', {
      params: {
        platform: filters.platform || undefined,
        campaign: filters.campaign || undefined,
        search: filters.search || undefined,
      },
    })
    // Guard against null when api.ts returns {data:null} during a 401 redirect
    return Array.isArray(res.data) ? res.data : []
  },

  async syncPosts(): Promise<void> {
    await apiClient.post('/posts/sync')
  },

  async getAutomationConfig(postId: string): Promise<AutomationConfig> {
    const res = await apiClient.get<AutomationConfig>(`/posts/${postId}/automation`)
    return res.data
  },

  async saveAutomationConfig(postId: string, config: AutomationConfig): Promise<AutomationConfig> {
    const payload = {
      platform_name: config.platform_name || 'instagram',
      automation_enabled: config.automation_enabled ?? false,
      match_type: config.match_type || 'contains',
      ignore_case: config.ignore_case ?? true,
      keywords: config.keywords || [],
      reply_enabled: config.reply_enabled ?? true,
      dm_enabled: config.dm_enabled ?? true,
      reply_template: config.reply_template || '',
      dm_template: config.dm_template || '',
      reply_delay: Number(config.reply_delay ?? 0),
      expires_at: config.expires_at || null,
      campaign_name: config.campaign_name || '',
    }
    const res = await apiClient.post<AutomationConfig>(`/posts/${postId}/automation`, payload)
    return res.data
  },

  async toggleAutomationEnabled(postId: string, enabled: boolean): Promise<void> {
    // Fetch existing config first to prevent 422 validation errors
    const currentConfig = await this.getAutomationConfig(postId)
    const payload = {
      ...currentConfig,
      automation_enabled: enabled,
    }
    await apiClient.post(`/posts/${postId}/automation`, payload)
  },
}

// ==========================================
// 4. CUSTOM REACT HOOKS
// ==========================================

function usePosts() {
  const [posts, setPosts] = useState<SyncPost[]>([])
  const [syncing, setSyncing] = useState(false)
  const [platformFilter, setPlatformFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch live synced records from the backend database
      const apiPosts = await postsService.getPosts({
        platform: platformFilter || undefined,
        campaign: campaignFilter || undefined,
        search: searchQuery || undefined,
      })

      // 2. Filter remaining static mock items array mapping
      const filteredDummies = platformFilter
        ? DUMMY_POSTS.filter((p) => p.platform === platformFilter)
        : DUMMY_POSTS

      // 3. Identify platforms that already have live database entries
      const activeLivePlatforms = new Set(apiPosts.map((post) => post.platform.toLowerCase()))

      // 4. Exclude dummy posts for any platform that has live data active
      const cleanedDummies = filteredDummies.filter(
        (dummy) => !activeLivePlatforms.has(dummy.platform.toLowerCase()),
      )

      // 5. Combine and update UI state cleanly (Prevents 1 post showing multiple cards)
      const combinedPosts = [...apiPosts, ...cleanedDummies]
      setPosts(combinedPosts)
    } catch (e) {
      console.error('Dashboard failed to reload active pipelines: ', e)
      setPosts(DUMMY_POSTS) // Fallback to avoid breaking UI layout
    }
  }, [platformFilter, campaignFilter, searchQuery])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      await postsService.syncPosts()
      await loadData()
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setSyncing(false)
    }
  }, [loadData])

  const handleToggleEnabled = useCallback(async (postId: string, enabled: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [postId]: enabled }))
    try {
      await postsService.toggleAutomationEnabled(postId, enabled)
    } catch {
      setEnabledMap((prev) => ({ ...prev, [postId]: !enabled }))
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    posts,
    syncing,
    enabledMap,
    platformFilter,
    campaignFilter,
    searchQuery,
    setPlatformFilter,
    setCampaignFilter,
    setSearchQuery,
    handleSync,
    handleToggleEnabled,
    refresh: loadData,
  }
}

function usePostSelection() {
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([])
  const togglePostSelection = useCallback((postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId],
    )
  }, [])
  const clearSelection = useCallback(() => {
    setSelectedPostIds([])
  }, [])
  return { selectedPostIds, togglePostSelection, clearSelection }
}

function usePostsPanel() {
  const [panelState, setPanelState] = useState<PanelState>({ mode: null, postId: null })
  const isDirtyRef = useRef<boolean>(false)

  const lockScroll = useCallback((lock: boolean) => {
    if (typeof window === 'undefined') return
    if (lock) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
      document.body.setAttribute('data-drawer-open', 'true')
    } else {
      document.body.removeAttribute('data-drawer-open')
      document.body.style.removeProperty('--scrollbar-width')
    }
  }, [])

  const openPanel = useCallback(
    (postId: string, mode: PanelMode) => {
      isDirtyRef.current = false
      setPanelState({ mode, postId })
      lockScroll(true)
    },
    [lockScroll],
  )

  const closePanel = useCallback(() => {
    isDirtyRef.current = false
    setPanelState({ mode: null, postId: null })
    lockScroll(false)
  }, [lockScroll])

  const tryClosePanel = useCallback(
    (isDirty?: boolean) => {
      const dirty = isDirty !== undefined ? isDirty : isDirtyRef.current
      if (dirty) {
        if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
          closePanel()
        }
      } else {
        closePanel()
      }
    },
    [closePanel],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelState.mode) {
        tryClosePanel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelState.mode, tryClosePanel])

  return {
    panelState,
    openPanel,
    closePanel,
    tryClosePanel,
  }
}

// ==========================================
// 5. PRESENTATIONAL COMPONENTS
// ==========================================

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`${styles.badge} ${styles[`platform_${platform}` as keyof typeof styles] ?? ''}`}>
      {platform}
    </span>
  )
}

function EmptyPostsState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <p className={styles.emptyTitle}>No posts found</p>
      <p className={styles.emptyText}>
        Sync your social accounts to start seeing posts here, or adjust your filters.
      </p>
    </div>
  )
}

interface PostCardProps {
  post: SyncPost
  isSelected: boolean
  automationEnabled: boolean
  onSelect: (postId: string) => void
  onConfigure: (postId: string) => void
  onToggleEnabled: (postId: string, enabled: boolean) => void
}

function PostCard({
  post,
  isSelected,
  automationEnabled,
  onSelect,
  onConfigure,
  onToggleEnabled,
}: PostCardProps) {
  // Resolve image: use real DB thumbnail, fall back to platform icon, then instagram icon
  const thumb = post.post_thumbnail || (PLATFORM_THUMBS[post.platform] ?? PLATFORM_THUMBS.instagram)
  return (
    <div
      className={`${styles.postCard} ${isSelected ? styles.postCardSelected : ''}`}
      onClick={() => onSelect(post.post_id)}
    >
      {isSelected && <div className={styles.selectionRing} />}
      <div className={styles.cardContent}>
        {/* Wrap thumbnail in link to post permalink */}
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cardLinkWrapper}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={thumb}
            alt={`${post.platform} post snapshot`}
            className={styles.cardThumb}
            onError={(e) => {
              // Self-healing: if CDN URL expires, swap to platform icon
              ;(e.target as HTMLImageElement).src =
                PLATFORM_THUMBS[post.platform] ?? PLATFORM_THUMBS.instagram
            }}
          />
        </a>
        <div className={styles.cardBody}>
          <p className={styles.cardCaption}>{post.caption ?? 'No caption available'}</p>

          <PlatformBadge platform={post.platform} />
          <div className={styles.checkboxRow} onClick={(e) => e.stopPropagation()}>
            <label className={styles.fieldLabel} htmlFor={`enable-${post.post_id}`}>
              Enabled:
            </label>
            <input
              id={`enable-${post.post_id}`}
              type="checkbox"
              checked={automationEnabled}
              onChange={(e) => onToggleEnabled(post.post_id, e.target.checked)}
              className={styles.checkbox}
            />
          </div>
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardFooterLabel}>Automation State</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConfigure(post.post_id)
          }}
          className={styles.btnGhost}
        >
          Configure Settings ▾
        </button>
      </div>
    </div>
  )
}

interface PostsGridProps {
  posts: SyncPost[]
  selectedPostIds: string[]
  enabledMap: Record<string, boolean>
  onSelect: (postId: string) => void
  onConfigure: (postId: string) => void
  onToggleEnabled: (postId: string, enabled: boolean) => void
}

function PostsGrid({
  posts,
  selectedPostIds,
  enabledMap,
  onSelect,
  onConfigure,
  onToggleEnabled,
}: PostsGridProps) {
  return (
    <div className={styles.postsGrid}>
      {posts.length === 0 && <EmptyPostsState />}
      {posts.map((post, index) => (
        <PostCard
          key={`${post.post_id}-${index}`}
          post={post}
          isSelected={selectedPostIds.includes(post.post_id)}
          automationEnabled={enabledMap[post.post_id] ?? false}
          onSelect={onSelect}
          onConfigure={onConfigure}
          onToggleEnabled={onToggleEnabled}
        />
      ))}
    </div>
  )
}

function PlatformDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected =
    PLATFORMS_FILTER_OPTIONS.find((p) => p.value === value) ?? PLATFORMS_FILTER_OPTIONS[0]

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  return (
    <div className={styles.platformDropdown} ref={ref}>
      <button className={styles.platformDropdownTrigger} onClick={() => setOpen((v) => !v)}>
        {selected.label}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className={styles.platformDropdownPanel}>
          {PLATFORMS_FILTER_OPTIONS.map((p) => (
            <button
              key={p.value}
              className={`${styles.platformDropdownItem} ${p.value === value ? styles.platformDropdownItemActive : ''}`}
              onClick={() => {
                onChange(p.value)
                setOpen(false)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface PostsToolbarProps {
  searchQuery: string
  platformFilter: string
  syncing: boolean
  selectedCount: number
  onSearch: (value: string) => void
  onPlatformChange: (platform: string) => void
  onSync: () => void
  onConfigureBatch: () => void
  onLogout: () => void
}

function PostsToolbar({
  searchQuery,
  platformFilter,
  syncing,
  selectedCount,
  onSearch,
  onPlatformChange,
  onSync,
  onConfigureBatch,
  onLogout,
}: PostsToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <p className={styles.eyebrow}>Social Channel</p>
        <h1 className={styles.pageTitle}>Posts Feed</h1>
        <p className={styles.pageLede}>Sync live Facebook / Instagram / LinkedIn post metrics</p>
      </div>
      <div className={styles.toolbarActions}>
        <input
          type="text"
          placeholder="Search captions…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.inputField}
        />
        <PlatformDropdown value={platformFilter} onChange={onPlatformChange} />
        {selectedCount > 0 && (
          <button onClick={onConfigureBatch} className={styles.btnPrimary}>
            Configure Batch ({selectedCount}) ▾
          </button>
        )}
        <button onClick={onSync} disabled={syncing} className={styles.btnOutline}>
          {syncing ? 'Syncing…' : 'Sync from Facebook / IG'}
        </button>
        <button onClick={onLogout} className={styles.btnOutline}>
          Log Out
        </button>
      </div>
    </div>
  )
}

interface ConfigureModeProps {
  postId: string
  selectedPosts?: SyncPost[]
  platformName: string
  onClose: () => void
  onSaved?: () => void
}

function ConfigureMode({
  postId,
  selectedPosts,
  platformName,
  onClose,
  onSaved,
}: ConfigureModeProps) {
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG)
  const [keywordsInput, setKeywordsInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!postId) {
      setConfig(DEFAULT_CONFIG)
      setKeywordsInput('')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    postsService
      .getAutomationConfig(postId)
      .then((data) => {
        if (cancelled) return
        const loaded = { ...DEFAULT_CONFIG, ...data }
        setConfig(loaded)
        setKeywordsInput(loaded.keywords?.join(', ') ?? '')
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  const update = (patch: Partial<AutomationConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  const handleSave = async () => {
    const isBulk = !postId && selectedPosts && selectedPosts.length > 0
    const targetCount = isBulk ? selectedPosts.length : 1
    const confirmMsg = isBulk
      ? `Are you sure you want to save this automation configuration to all ${targetCount} selected posts?`
      : 'Are you sure you want to save this automation configuration to the database?'

    if (typeof window !== 'undefined' && !window.confirm(confirmMsg)) return

    setSaving(true)
    setError('')
    try {
      if (isBulk) {
        await Promise.all(
          selectedPosts.map((post) =>
            postsService.saveAutomationConfig(post.post_id, {
              ...config,
              platform_name: post.platform,
            }),
          ),
        )
      } else {
        await postsService.saveAutomationConfig(postId, {
          ...config,
          platform_name: platformName,
        })
      }
      onSaved?.()
      onClose()

      if (typeof window !== 'undefined') {
        alert(
          isBulk ? `Changes applied to all ${targetCount} posts.` : 'Changes successfully saved.',
        )
      }
    } catch (e: any) {
      let parsedError = 'Save failed'
      if (e?.response?.data?.detail) {
        if (Array.isArray(e.response.data.detail)) {
          parsedError = e.response.data.detail
            .map((err: any) => `${err.loc?.join('.') || 'Field'}: ${err.msg}`)
            .join(' | ')
        } else {
          parsedError = String(e.response.data.detail)
        }
      } else if (e?.message) {
        parsedError = e.message
      }
      setError(parsedError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading configuration…</p>
      </div>
    )
  }

  return (
    <div className={styles.formBody}>
      <div className={styles.checkboxRow}>
        <input
          id="cfg-automation-enabled"
          type="checkbox"
          checked={config.automation_enabled}
          onChange={(e) => update({ automation_enabled: e.target.checked })}
          className={styles.checkbox}
        />
        <label
          htmlFor="cfg-automation-enabled"
          className={styles.fieldLabel}
          style={{ marginBottom: 0 }}
        >
          Automation Enabled
        </label>
      </div>

      <div>
        <label className={styles.fieldLabel} htmlFor="cfg-keywords">
          Keywords (Comma separated)
        </label>
        <input
          id="cfg-keywords"
          type="text"
          value={keywordsInput}
          onChange={(e) => {
            setKeywordsInput(e.target.value)
            update({
              keywords: e.target.value
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean),
            })
          }}
          placeholder="CATALOG, DISCOUNT"
          className={styles.modalInput}
        />
      </div>

      <div className={styles.fieldRow}>
        <div>
          <label className={styles.fieldLabel} htmlFor="cfg-match-type">
            Match Type
          </label>
          <select
            id="cfg-match-type"
            value={config.match_type}
            onChange={(e) => update({ match_type: e.target.value as any })}
            className={styles.modalSelect}
          >
            <option value="contains">Contains</option>
            <option value="exact">Exact</option>
            <option value="starts_with">Starts With</option>
            <option value="ends_with">Ends With</option>
          </select>
        </div>

        <div className={styles.checkboxRow} style={{ paddingTop: 22 }}>
          <input
            id="cfg-ignore-case"
            type="checkbox"
            checked={config.ignore_case}
            onChange={(e) => update({ ignore_case: e.target.checked })}
            className={styles.checkbox}
          />
          <label
            htmlFor="cfg-ignore-case"
            className={styles.fieldLabel}
            style={{ marginBottom: 0 }}
          >
            Ignore Case
          </label>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <div className={styles.checkboxRow}>
          <input
            id="cfg-reply-enabled"
            type="checkbox"
            checked={config.reply_enabled}
            onChange={(e) => update({ reply_enabled: e.target.checked })}
            className={styles.checkbox}
          />
          <label
            htmlFor="cfg-reply-enabled"
            className={styles.fieldLabel}
            style={{ marginBottom: 0 }}
          >
            Enable Public Reply
          </label>
        </div>

        <div className={styles.checkboxRow}>
          <input
            id="cfg-dm-enabled"
            type="checkbox"
            checked={config.dm_enabled}
            onChange={(e) => update({ dm_enabled: e.target.checked })}
            className={styles.checkbox}
          />
          <label htmlFor="cfg-dm-enabled" className={styles.fieldLabel} style={{ marginBottom: 0 }}>
            Enable DM
          </label>
        </div>
      </div>

      <div>
        <label className={styles.fieldLabel} htmlFor="cfg-reply-template">
          Reply Template
        </label>
        <textarea
          id="cfg-reply-template"
          value={config.reply_template}
          onChange={(e) => update({ reply_template: e.target.value })}
          rows={2}
          className={styles.modalTextarea}
        />
      </div>

      <div>
        <label className={styles.fieldLabel} htmlFor="cfg-dm-template">
          DM Template
        </label>
        <textarea
          id="cfg-dm-template"
          value={config.dm_template}
          onChange={(e) => update({ dm_template: e.target.value })}
          rows={3}
          className={styles.modalTextarea}
        />
      </div>

      <div className={styles.fieldRow}>
        <div>
          <label className={styles.fieldLabel} htmlFor="cfg-reply-delay">
            Reply Delay
          </label>
          <select
            id="cfg-reply-delay"
            value={config.reply_delay}
            onChange={(e) => update({ reply_delay: Number(e.target.value) })}
            className={styles.modalSelect}
          >
            <option value={0}>Immediately</option>
            <option value={30}>30 sec</option>
            <option value={60}>1 min</option>
            <option value={120}>2 min</option>
          </select>
        </div>

        <div>
          <label className={styles.fieldLabel} htmlFor="cfg-expires-at">
            Expiry Date
          </label>
          <input
            id="cfg-expires-at"
            type="date"
            value={config.expires_at ? config.expires_at.split('T')[0] : ''}
            onChange={(e) =>
              update({ expires_at: e.target.value ? `${e.target.value}T23:59:59Z` : null })
            }
            className={styles.modalDateInput}
          />
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.btnOutline}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className={styles.btnPrimary}>
          {saving ? 'Saving…' : 'Save to Database'}
        </button>
      </div>
    </div>
  )
}

interface PostsSlidePanelProps {
  mode: PanelMode
  postId: string | null
  post: SyncPost | null
  selectedPosts: SyncPost[]
  onClose: () => void
  onSaved?: () => void
}

const PANEL_TITLES: Record<string, string> = {
  configure: 'Configure Post Automation',
}

function PostsSlidePanel({
  mode,
  postId,
  post,
  selectedPosts,
  onClose,
  onSaved,
}: PostsSlidePanelProps) {
  if (!mode) return null

  const isBulk = mode === 'configure' && !postId && selectedPosts.length > 0
  const title = isBulk
    ? `Configure Batch Automation (${selectedPosts.length} posts)`
    : (PANEL_TITLES[mode] ?? '')

  const renderPanel = () => (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>{title}</h2>
            {postId && post && mode === 'configure' && (
              <p className={styles.panelSubtitle}>
                {post.platform} · {post.post_id}
              </p>
            )}
            {isBulk && (
              <p className={styles.panelSubtitle}>
                Applying changes to {selectedPosts.length} posts in bulk
              </p>
            )}
          </div>
          <button onClick={onClose} className={styles.panelClose} aria-label="Close panel">
            ×
          </button>
        </div>
        <div className={styles.panelContent}>
          {mode === 'configure' && (postId || selectedPosts.length > 0) && (
            <ConfigureMode
              postId={postId || ''}
              selectedPosts={selectedPosts}
              platformName={post?.platform ?? selectedPosts[0]?.platform ?? 'instagram'}
              onClose={onClose}
              onSaved={onSaved}
            />
          )}
        </div>
      </div>
    </>
  )

  return typeof window !== 'undefined' ? createPortal(renderPanel(), document.body) : null
}

// ==========================================
// 6. MAIN ORCHESTRATOR COMPONENT
// ==========================================

export default function PostsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Enforce session check on route load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
      } else {
        setIsAuthenticated(true)
      }
    }
  }, [])

  const {
    posts,
    syncing,
    enabledMap,
    platformFilter,
    searchQuery,
    setPlatformFilter,
    setSearchQuery,
    handleSync,
    handleToggleEnabled,
    refresh,
  } = usePosts()

  const { selectedPostIds, togglePostSelection, clearSelection } = usePostSelection()
  const { panelState, openPanel, closePanel } = usePostsPanel()

  const activePost = posts.find((p) => p.post_id === panelState.postId) ?? null
  const selectedPosts = posts.filter((p) => selectedPostIds.includes(p.post_id))

  const handleConfigureBatch = () => {
    if (selectedPostIds.length === 0) return
    openPanel('', 'configure')
  }

  const handlePanelSaved = () => {
    clearSelection()
    refresh()
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }

  // Prevent background UI flashing during authentication verification
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className={styles.page}>
      <PostsToolbar
        searchQuery={searchQuery}
        platformFilter={platformFilter}
        syncing={syncing}
        selectedCount={selectedPostIds.length}
        onSearch={setSearchQuery}
        onPlatformChange={setPlatformFilter}
        onSync={handleSync}
        onConfigureBatch={handleConfigureBatch}
        onLogout={handleLogout}
      />

      <PostsGrid
        posts={posts}
        selectedPostIds={selectedPostIds}
        enabledMap={enabledMap}
        onSelect={togglePostSelection}
        onConfigure={(postId) => openPanel(postId, 'configure')}
        onToggleEnabled={handleToggleEnabled}
      />

      <PostsSlidePanel
        mode={panelState.mode}
        postId={panelState.postId}
        post={activePost}
        selectedPosts={selectedPosts}
        onClose={closePanel}
        onSaved={handlePanelSaved}
      />
    </div>
  )
}
