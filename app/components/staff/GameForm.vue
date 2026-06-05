<template>
  <form @submit.prevent="submit">
    <div class="lg:grid lg:gap-6 form-grid items-start">

      <!-- ── Left: Details card ────────────────────────────── -->
      <div class="form-card mb-6 lg:mb-0 flex flex-col gap-md">

        <!-- Find game (static name search): dashed border with brand accent -->
        <div class="bgg-block border-2 border-dashed p-md">
          <p class="text-ui font-medium mb-2" style="color: var(--color-brand)">
            Find game
            <span class="font-normal" style="color: var(--color-text-muted)"> — fills the name and links its BoardGameGeek page</span>
          </p>
          <StaffGameSearch @select="onBggSelect" />

          <div v-if="selectedBgg" class="mt-3 flex items-center gap-3">
            <div class="flex-1 text-ui" style="color: var(--color-text-primary)">
              <span class="font-medium">{{ selectedBgg.name }}</span>
              <span v-if="selectedBgg.yearPublished" class="ml-2" style="color: var(--color-text-muted)">({{ selectedBgg.yearPublished }})</span>
              <span v-if="bggId !== null" class="ml-2 text-meta" style="color: var(--color-brand)">· linked</span>
            </div>
            <button
              type="button"
              class="text-ui p-1 hover:opacity-70"
              style="color: var(--color-text-muted)"
              aria-label="Clear selection"
              @click="clearBgg"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Name -->
        <div>
          <label for="game-name" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Name *</label>
          <SharedInput id="game-name" v-model="form.name" type="text" required maxlength="255" style="font-size: 1.15rem; font-weight: 700" />
        </div>

        <!-- Description -->
        <div>
          <div class="flex items-center justify-between gap-3 mb-1">
            <label for="game-description" class="block text-ui font-medium" style="color: var(--color-text-secondary)">Description</label>
            <button
              type="button"
              class="wiki-btn inline-flex items-center gap-1 text-meta font-medium"
              :disabled="!form.name.trim() || fetchingWiki"
              @click="fetchWikiInfo"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.5c1.5-1.5 4-2 6-1.5v12c-2-0.5-4.5 0-6 1.5m0-12C10.5 5 8 4.5 6 5v12c2-.5 4.5 0 6 1.5m0-12v12" />
              </svg>
              {{ fetchingWiki ? 'Fetching…' : 'Fetch from Wikipedia' }}
            </button>
          </div>
          <textarea
            id="game-description"
            v-model="form.description"
            rows="4"
            maxlength="2000"
            class="textarea w-full px-3 py-2 text-ui resize-y"
            style="color: var(--color-text-primary)"
          />
          <p v-if="wikiMessage" class="mt-1 text-meta" :style="`color: ${wikiError ? 'var(--color-error)' : 'var(--color-brand)'}`">{{ wikiMessage }}</p>
        </div>

        <!-- Players: double-ended slider -->
        <div>
          <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Players *</label>
          <SharedRangeSlider
            v-model:low="form.playerMin"
            v-model:high="form.playerMax"
            :min="1"
            :max="12"
            :step="1"
            :format="formatPlayers"
            low-label="Minimum players"
            high-label="Maximum players"
          />
        </div>

        <!-- Play time: double-ended slider -->
        <div>
          <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Play time *</label>
          <SharedRangeSlider
            v-model:low="form.timeMin"
            v-model:high="form.timeMax"
            :min="5"
            :max="240"
            :step="5"
            :format="formatTime"
            low-label="Minimum play time"
            high-label="Maximum play time"
          />
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Tags</label>
          <StaffTagTypeahead
            v-model="selectedTags"
            :available-tags="availableTags"
          />
        </div>

        <!-- External link -->
        <div>
          <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">External link</label>
          <SharedInput
            v-model="linkUrl"
            type="url"
            placeholder="https://boardgamegeek.com/boardgame/…"
            maxlength="2000"
            @input="onLinkUrlInput"
            @blur="onLinkUrlBlur"
          />
          <div v-if="bggId !== null" class="mt-1.5">
            <div v-if="!linkUrl.trim()" class="bgg-active text-meta flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              BoardGameGeek link active
            </div>
            <button
              v-else
              type="button"
              class="resolve-btn text-meta"
              @click="clearCustomLink"
            >
              ↩ Use BoardGameGeek link instead
            </button>
          </div>

          <!-- Title row: appears once URL has content -->
          <div v-if="linkUrl.trim()" class="mt-2">
            <div class="flex items-center gap-2 mb-1">
              <label class="text-meta font-medium" style="color: var(--color-text-secondary)">Link label</label>
              <span v-if="resolvingLink" class="text-meta" style="color: var(--color-text-muted)">Fetching…</span>
              <button
                v-else
                type="button"
                class="resolve-btn text-meta"
                @click="resolveLink(true)"
              >
                ↻ Re-fetch
              </button>
            </div>
            <SharedInput
              v-model="linkTitle"
              type="text"
              placeholder="e.g. View on BoardGameGeek"
              maxlength="500"
            />
          </div>

          <!-- Live preview -->
          <div
            v-if="linkUrl.trim() && linkTitle.trim()"
            class="link-preview mt-2 flex items-center justify-between gap-3 px-3 py-2 text-meta"
          >
            <span class="truncate" style="color: var(--color-text-primary)">
              {{ linkPreviewParts.prefix }}<span class="font-semibold">{{ linkPreviewParts.name }}</span>
            </span>
            <svg class="w-4 h-4 shrink-0" style="color: var(--color-text-muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>

      <!-- ── Right column ───────────────────────────────────── -->
      <div class="flex flex-col gap-4">

        <!-- Featuring is managed from the games list, not here. The featured
             state is still sent unchanged so editing a game preserves it. -->

        <!-- Photos card -->
        <div class="form-card">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">Photos</h2>

          <StaffPhotoUpload
            v-if="savedGameId"
            ref="photoUpload"
            :game-id="savedGameId"
            :existing-photos="existingPhotoHashes"
            :game-name="form.name"
            @uploaded="onPhotosUploaded"
            @deleted="onPhotoDeleted"
            @rotated="onPhotoRotated"
            @reordered="onPhotosReordered"
          />
          <p v-else class="text-ui" style="color: var(--color-text-muted)">Save the game first, then add photos.</p>
        </div>

      </div>
    </div>

    <!-- Footer actions: right-aligned -->
    <div class="flex justify-end items-center gap-3 mt-6 pt-6 footer-border">
      <p v-if="error" class="flex-1 text-ui" style="color: var(--color-error)">{{ error }}</p>
      <button
        type="button"
        class="cancel-btn inline-flex items-center justify-center text-ui font-medium px-4 py-2 transition-colors"
        style="color: var(--color-text-primary)"
        @click="navigateTo('/staff')"
      >
        Cancel
      </button>
      <SharedButton
        type="submit"
        :pending="pending"
        pending-label="Saving…"
      >
        {{ submitLabel }}
      </SharedButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TagOption } from './TagTypeahead.vue'
import type { GameSearchResult } from './GameSearch.vue'

type GameFormData = {
  name: string
  description: string | null
  playerMin: number
  playerMax: number
  timeMin: number
  timeMax: number
  featured: boolean
  featuredNote: string | null
  tagIds: number[]
  newTagNames: string[]
  bggId?: number | null
  linkUrl?: string | null
  linkTitle?: string | null
}

const props = defineProps<{
  initial?: Partial<GameFormData> & { id?: number; photoHashes?: string[] }
  availableTags: TagOption[]
  featuredCount: number
  submitLabel?: string
}>()

const emit = defineEmits<{
  saved: [gameId: number]
}>()

const submitLabel = computed(() => props.submitLabel ?? 'Save game')

// 12 is the slider ceiling; show it as "12+" since some games seat more.
function formatPlayers(v: number): string {
  return v >= 12 ? '12+' : String(v)
}

function formatTime(v: number): string {
  if (v < 60) return `${v} min`
  const h = Math.floor(v / 60)
  const m = v % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const form = reactive({
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? null,
  playerMin: props.initial?.playerMin ?? 2,
  playerMax: props.initial?.playerMax ?? 4,
  timeMin: props.initial?.timeMin ?? 30,
  timeMax: props.initial?.timeMax ?? 60,
  featured: props.initial?.featured ?? false,
  featuredNote: props.initial?.featuredNote ?? null,
})

const bggId = ref<number | null>(props.initial?.bggId ?? null)
const selectedBgg = ref<GameSearchResult | null>(null)
const linkUrl = ref<string>(props.initial?.linkUrl ?? '')
const linkTitle = ref<string>(props.initial?.linkTitle ?? '')
const resolvingLink = ref(false)
let resolveTimer: ReturnType<typeof setTimeout> | null = null
const fetchingWiki = ref(false)
const wikiMessage = ref('')
const wikiError = ref(false)

const selectedTags = ref<TagOption[]>(
  (props.initial?.tagIds ?? []).map((id) => {
    const found = props.availableTags.find((t) => t.id === id)
    return found ?? { id, name: String(id) }
  }),
)

const existingPhotoHashes = ref<string[]>(props.initial?.photoHashes ?? [])
const savedGameId = ref<number | undefined>(props.initial?.id)
const photoUpload = ref<{ upload: () => Promise<void> } | null>(null)
const error = ref('')
const pending = ref(false)

function onBggSelect(result: GameSearchResult) {
  // Always apply the picked result: set the name and link the BGG page (powers
  // the detail-page "View on BoardGameGeek" link), so re-picking another result
  // replaces the previous one.
  selectedBgg.value = result
  bggId.value = result.bggId
  form.name = result.name
}

function clearBgg() {
  selectedBgg.value = null
  bggId.value = null
}

type WikiInfo = {
  description: string | null
  playerMin: number | null
  playerMax: number | null
  timeMin: number | null
  timeMax: number | null
}

// Pull description + players + play time from Wikipedia for the current game name
// (each field editable; only what Wikipedia returns is applied).
async function fetchWikiInfo() {
  const name = form.name.trim()
  if (!name) return
  fetchingWiki.value = true
  wikiMessage.value = ''
  wikiError.value = false
  try {
    const info = await $fetch<WikiInfo>('/api/wikipedia/info', { query: { name } })
    let filled = false
    if (info.description) { form.description = info.description; filled = true }
    if (info.playerMin !== null) { form.playerMin = info.playerMin; filled = true }
    if (info.playerMax !== null) { form.playerMax = info.playerMax; filled = true }
    if (info.timeMin !== null) { form.timeMin = info.timeMin; filled = true }
    if (info.timeMax !== null) { form.timeMax = info.timeMax; filled = true }
    if (filled) {
      wikiMessage.value = 'Filled from Wikipedia — review and edit.'
    } else {
      wikiMessage.value = 'No confident Wikipedia match — fill in manually.'
      wikiError.value = true
    }
  } catch {
    wikiMessage.value = 'Could not reach Wikipedia.'
    wikiError.value = true
  } finally {
    fetchingWiki.value = false
  }
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// Derive "View on SiteName" from hostname as a fallback. Handles compound
// TLDs like .co.za by checking whether the second-to-last label is a known SLD.
function hostLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const parts = host.split('.')
    const sld = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or'])
    let nameIdx = parts.length - 2
    if (parts.length >= 3 && sld.has(parts[parts.length - 2])) nameIdx = parts.length - 3
    const name = parts[Math.max(0, nameIdx)] ?? parts[0]
    return `View on ${name.charAt(0).toUpperCase()}${name.slice(1)}`
  } catch {
    return 'View link'
  }
}

// Extract the site/brand name from a page <title>.
// Most sites use "Page Title | Brand Name" or "Page Title – Brand Name".
function extractSiteName(title: string): string | null {
  for (const sep of ['|', '–', ' - ']) {
    const parts = title.split(sep)
    if (parts.length >= 2) {
      const last = parts[parts.length - 1].trim()
      if (last.length >= 2 && last.length <= 80) return last
    }
  }
  return null
}

const linkPreviewParts = computed(() => {
  const t = linkTitle.value.trim()
  if (t.startsWith('View on ')) return { prefix: 'View on ', name: t.slice(8) }
  return { prefix: '', name: t }
})

async function resolveLink(override: boolean) {
  const url = linkUrl.value.trim()
  if (!url || !isValidUrl(url)) return
  resolvingLink.value = true
  try {
    const result = await $fetch<{ title: string | null }>('/api/staff/resolve-link', {
      method: 'POST',
      body: { url },
    })
    const siteName = result.title ? extractSiteName(result.title) : null
    const label = siteName ? `View on ${siteName}` : hostLabel(url)
    if (override || !linkTitle.value.trim()) linkTitle.value = label
  } catch {
    if (override || !linkTitle.value.trim()) linkTitle.value = hostLabel(url)
  } finally {
    resolvingLink.value = false
  }
}

function clearCustomLink() {
  linkUrl.value = ''
  linkTitle.value = ''
}

function onLinkUrlInput() {
  if (resolveTimer) clearTimeout(resolveTimer)
  const url = linkUrl.value.trim()
  if (!url) { linkTitle.value = ''; return }
  if (!isValidUrl(url)) return
  resolveTimer = setTimeout(() => resolveLink(true), 700)
}

function onLinkUrlBlur() {
  if (resolveTimer) { clearTimeout(resolveTimer); resolveTimer = null }
  const url = linkUrl.value.trim()
  if (url && isValidUrl(url) && !linkTitle.value.trim()) resolveLink(false)
}

async function submit() {
  error.value = ''
  pending.value = true

  try {
    const existingTagIds = selectedTags.value.filter((t) => t.id !== undefined).map((t) => t.id!)
    const newTagNames = selectedTags.value.filter((t) => t.id === undefined).map((t) => t.name)

    const body = {
      ...form,
      tagIds: existingTagIds,
      newTagNames,
      bggId: bggId.value,
      linkUrl: linkUrl.value.trim() || null,
      linkTitle: linkTitle.value.trim() || null,
    }

    if (savedGameId.value) {
      await $fetch(`/api/staff/games/${savedGameId.value}`, { method: 'PATCH', body })
    } else {
      const result = await $fetch<{ id: number }>('/api/staff/games', { method: 'POST', body })
      savedGameId.value = result.id
    }

    if (photoUpload.value) {
      await photoUpload.value.upload()
    }

    emit('saved', savedGameId.value!)
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    error.value = msg ?? 'Something went wrong. Please try again.'
    console.error(err)
  } finally {
    pending.value = false
  }
}

function onPhotosUploaded(hashes: string[]) {
  existingPhotoHashes.value = [...existingPhotoHashes.value, ...hashes]
}

function onPhotoDeleted(hash: string) {
  existingPhotoHashes.value = existingPhotoHashes.value.filter((h) => h !== hash)
}

function onPhotoRotated(payload: { oldHash: string; newHash: string }) {
  existingPhotoHashes.value = existingPhotoHashes.value.map((h) =>
    h === payload.oldHash ? payload.newHash : h,
  )
}

function onPhotosReordered(order: string[]) {
  existingPhotoHashes.value = [...order]
}
</script>

<style scoped>
@media (min-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr 320px;
  }
}

.form-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.bgg-block {
  border-color: rgb(21 128 61 / 0.3);
  border-radius: var(--radius-md);
}

.textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
}
.textarea:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgb(21 128 61 / 0.15);
}

.wiki-btn {
  color: var(--color-brand);
  cursor: pointer;
}
.wiki-btn:hover:not(:disabled) {
  text-decoration: underline;
}
.wiki-btn:disabled {
  color: var(--color-text-muted);
  cursor: default;
}

.checkbox {
  border-radius: var(--radius-sm);
  border-color: var(--color-border-strong);
}

.footer-border {
  border-top: 1px solid var(--color-border);
}

.cancel-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}
.cancel-btn:hover {
  background: var(--color-surface-elevated);
}

.link-preview {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.resolve-btn {
  color: var(--color-brand);
  cursor: pointer;
}
.resolve-btn:hover {
  text-decoration: underline;
}

.bgg-active {
  color: var(--color-brand);
}
</style>
