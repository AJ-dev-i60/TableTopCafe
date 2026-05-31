<template>
  <form @submit.prevent="submit">
    <div class="lg:grid lg:gap-6 form-grid items-start">

      <!-- ── Left: Details card ────────────────────────────── -->
      <div class="form-card mb-6 lg:mb-0 flex flex-col gap-md">

        <!-- BGG lookup: dashed border with brand accent -->
        <div class="bgg-block border-2 border-dashed p-md">
          <p class="text-ui font-medium mb-2" style="color: var(--color-brand)">
            BGG lookup
            <span class="font-normal" style="color: var(--color-text-muted)"> — select a game to pre-fill the form</span>
          </p>
          <StaffBggSearch @select="onBggSelect" />

          <div v-if="selectedBgg" class="mt-3 flex items-center gap-3">
            <div class="flex-1 text-ui" style="color: var(--color-text-primary)">
              <span class="font-medium">{{ selectedBgg.name }}</span>
              <span v-if="selectedBgg.yearPublished" class="ml-2" style="color: var(--color-text-muted)">({{ selectedBgg.yearPublished }})</span>
            </div>
            <SharedButton
              v-if="selectedBgg.bggId !== null"
              type="button"
              :pending="fetchingBgg"
              pending-label="Fetching…"
              @click="fetchBggInfo"
            >
              Fetch game info
            </SharedButton>
            <span v-else class="text-meta" style="color: var(--color-text-muted)">
              No linked BGG entry — enter details manually.
            </span>
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
          <p v-if="bggError" class="mt-2 text-meta" style="color: var(--color-error)">{{ bggError }}</p>
        </div>

        <!-- Name -->
        <div>
          <label for="game-name" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Name *</label>
          <SharedInput id="game-name" v-model="form.name" type="text" required maxlength="255" />
        </div>

        <!-- Players min/max: 2-up -->
        <div class="grid grid-cols-2 gap-md">
          <div>
            <label for="game-player-min" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Min players *</label>
            <SharedInput id="game-player-min" v-model.number="form.playerMin" type="number" min="1" required />
          </div>
          <div>
            <label for="game-player-max" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Max players *</label>
            <SharedInput id="game-player-max" v-model.number="form.playerMax" type="number" min="1" required />
          </div>
        </div>

        <!-- Play time min/max: 2-up -->
        <div class="grid grid-cols-2 gap-md">
          <div>
            <label for="game-time-min" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Min time (min) *</label>
            <SharedInput id="game-time-min" v-model.number="form.timeMin" type="number" min="1" required />
          </div>
          <div>
            <label for="game-time-max" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Max time (min) *</label>
            <SharedInput id="game-time-max" v-model.number="form.timeMax" type="number" min="1" required />
          </div>
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

        <!-- Featured card -->
        <div class="form-card">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">Featured</h2>

          <label class="flex items-center gap-2" :class="atFeaturedLimit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
            <input
              v-model="form.featured"
              type="checkbox"
              class="checkbox"
              :disabled="atFeaturedLimit"
            />
            <span class="text-ui font-medium" style="color: var(--color-text-primary)">Mark as featured</span>
          </label>
          <p class="text-meta mt-1" style="color: var(--color-text-muted)">
            <span v-if="atFeaturedLimit">3 of 3 featured — un-feature one first.</span>
            <span v-else>{{ props.featuredCount }} of 3 featured slots used.</span>
          </p>

          <div v-if="form.featured" class="mt-3">
            <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Staff pick note</label>
            <SharedInput
              :model-value="form.featuredNote ?? undefined"
              type="text"
              maxlength="500"
              placeholder="Optional — shown on the game's detail page"
              @update:model-value="(v) => { form.featuredNote = String(v) }"
            />
          </div>
        </div>

        <!-- Photos card -->
        <div class="form-card">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">Photos</h2>

          <div v-if="bggImages.length > 0 && savedGameId" class="mb-3">
            <p class="text-meta mb-2" style="color: var(--color-text-muted)">Click a BGG image to attach it:</p>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="url in bggImages"
                :key="url"
                type="button"
                :disabled="attachingBggImage === url"
                class="bgg-thumb overflow-hidden border-2 transition-colors disabled:opacity-50"
                @click="attachBggImage(url)"
              >
                <img :src="url" alt="BGG image" class="w-24 h-24 object-cover" loading="lazy" />
              </button>
            </div>
            <p v-if="bggImageError" class="mt-1 text-meta" style="color: var(--color-error)">{{ bggImageError }}</p>
          </div>
          <div v-else-if="bggImages.length > 0 && !savedGameId" class="mb-3">
            <p class="text-meta" style="color: var(--color-text-muted)">Save the game first to attach the BGG image.</p>
          </div>

          <StaffPhotoUpload
            v-if="savedGameId"
            ref="photoUpload"
            :game-id="savedGameId"
            :existing-photos="existingPhotoHashes"
            @uploaded="onPhotosUploaded"
          />
          <p v-else-if="bggImages.length === 0" class="text-ui" style="color: var(--color-text-muted)">Save the game first, then add photos.</p>
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

type BggThingDetail = {
  bggId: number
  name: string
  description: string | null
  yearPublished: number | null
  playerMin: number | null
  playerMax: number | null
  timeMin: number | null
  timeMax: number | null
  thumbnail: string | null
  image: string | null
  categories: string[]
  mechanics: string[]
}

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
const atFeaturedLimit = computed(() => props.featuredCount >= 3 && !form.featured)

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
const fetchingBgg = ref(false)
const bggError = ref('')
const bggImages = ref<string[]>([])
const attachingBggImage = ref<string | null>(null)
const bggImageError = ref('')

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
  bggError.value = ''
  // Pre-fill the name from the selected list entry. If the game has a BGG id and
  // the user clicks "Fetch game info", the canonical BGG data overwrites this.
  if (!form.name.trim()) form.name = result.name
}

function clearBgg() {
  selectedBgg.value = null
  bggImages.value = []
  bggError.value = ''
  bggId.value = null
}

async function fetchBggInfo() {
  const bgg = selectedBgg.value
  if (!bgg || bgg.bggId === null) return
  fetchingBgg.value = true
  bggError.value = ''
  try {
    const detail = await $fetch<BggThingDetail>(`/api/bgg/thing/${bgg.bggId}`)
    bggId.value = detail.bggId
    if (detail.name) form.name = detail.name
    if (detail.description) form.description = detail.description
    if (detail.playerMin) form.playerMin = detail.playerMin
    if (detail.playerMax) form.playerMax = detail.playerMax
    if (detail.timeMin) form.timeMin = detail.timeMin
    if (detail.timeMax) form.timeMax = detail.timeMax

    const images: string[] = []
    if (detail.image) images.push(detail.image)
    else if (detail.thumbnail) images.push(detail.thumbnail)
    bggImages.value = images
  } catch {
    bggError.value = 'Could not fetch BGG data. Fill in the form manually.'
  } finally {
    fetchingBgg.value = false
  }
}

async function attachBggImage(url: string) {
  if (!savedGameId.value) return
  attachingBggImage.value = url
  bggImageError.value = ''
  try {
    const res = await $fetch<{ hash: string }>(
      `/api/staff/games/${savedGameId.value}/photos/bgg-fetch`,
      { method: 'POST', body: { imageUrl: url } },
    )
    existingPhotoHashes.value = [...existingPhotoHashes.value, res.hash]
    bggImages.value = bggImages.value.filter((u) => u !== url)
  } catch {
    bggImageError.value = 'Failed to attach image. Try uploading manually.'
  } finally {
    attachingBggImage.value = null
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

.bgg-thumb {
  border-radius: var(--radius-md);
  border-color: var(--color-border);
}
.bgg-thumb:hover {
  border-color: var(--color-brand);
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
