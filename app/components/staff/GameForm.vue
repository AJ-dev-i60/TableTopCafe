<template>
  <form @submit.prevent="submit">
    <div class="lg:grid lg:gap-6 form-grid items-start">

      <!-- ── Left: Details card ────────────────────────────── -->
      <div class="form-card mb-6 lg:mb-0 flex flex-col gap-md">

        <!-- BGG lookup: dashed border with brand accent -->
        <div class="bgg-block border-2 border-dashed p-md">
          <p class="text-ui font-medium mb-2" style="color: var(--color-brand)">
            BGG lookup
            <span class="font-normal" style="color: var(--color-text-muted)"> — find the game to link it and pre-fill the name</span>
          </p>
          <StaffBggSearch @select="onBggSelect" />

          <div v-if="selectedBgg" class="mt-3 flex items-center gap-3">
            <div class="flex-1 text-ui" style="color: var(--color-text-primary)">
              <span class="font-medium">{{ selectedBgg.name }}</span>
              <span v-if="selectedBgg.yearPublished" class="ml-2" style="color: var(--color-text-muted)">({{ selectedBgg.yearPublished }})</span>
              <span v-if="bggId !== null" class="ml-2 text-meta" style="color: var(--color-brand)">· linked — fetch the cover under Photos</span>
            </div>
            <button
              type="button"
              class="text-ui p-1 hover:opacity-70"
              style="color: var(--color-text-muted)"
              aria-label="Clear BGG selection"
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
          <label for="game-description" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Description</label>
          <textarea
            id="game-description"
            v-model="form.description"
            rows="4"
            maxlength="2000"
            class="textarea w-full px-3 py-2 text-ui resize-y"
            style="color: var(--color-text-primary)"
          />
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
      </div>

      <!-- ── Right column ───────────────────────────────────── -->
      <div class="flex flex-col gap-4">

        <!-- Featuring is managed from the games list, not here. The featured
             state is still sent unchanged so editing a game preserves it. -->

        <!-- Photos card -->
        <div class="form-card">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">Photos</h2>

          <div v-if="savedGameId && bggId !== null" class="mb-3">
            <SharedButton type="button" :pending="fetchingCover" pending-label="Fetching cover…" @click="fetchCover">
              Fetch cover from BGG
            </SharedButton>
            <p v-if="coverError" class="mt-1 text-meta" style="color: var(--color-error)">{{ coverError }}</p>
          </div>

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
import type { BggResult } from './BggSearch.vue'

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
const selectedBgg = ref<BggResult | null>(null)
const fetchingCover = ref(false)
const coverError = ref('')

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

function onBggSelect(result: BggResult) {
  selectedBgg.value = result
  // Link the game to its BGG entry (enables the cover fetch + the detail-page
  // "View on BoardGameGeek" link) and pre-fill the name if empty.
  bggId.value = result.bggId
  if (!form.name.trim()) form.name = result.name
}

function clearBgg() {
  selectedBgg.value = null
  bggId.value = null
}

// Fetch the cover from the game's BGG page (scraped server-side) and store it as
// a photo. Requires the game to be saved and linked to a BGG id.
async function fetchCover() {
  if (!savedGameId.value) return
  fetchingCover.value = true
  coverError.value = ''
  try {
    const res = await $fetch<{ hash: string }>(
      `/api/staff/games/${savedGameId.value}/photos/bgg-cover`,
      { method: 'POST' },
    )
    existingPhotoHashes.value = [...existingPhotoHashes.value, res.hash]
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    coverError.value = msg ?? 'Could not fetch the cover from BGG.'
  } finally {
    fetchingCover.value = false
  }
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
</style>
