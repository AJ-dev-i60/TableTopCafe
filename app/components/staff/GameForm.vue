<template>
  <form @submit.prevent="submit">

    <!-- BGG lookup -->
    <div class="mb-lg border border-[--color-border] rounded-[--radius-md] p-md bg-[--color-surface-muted]">
      <p class="text-ui font-medium text-[--color-text-secondary] mb-2">
        Look up on BoardGameGeek <span class="font-normal text-[--color-text-muted]">(optional — pre-fills the form)</span>
      </p>
      <StaffBggSearch @select="onBggSelect" />

      <div v-if="selectedBgg" class="mt-3 flex items-center gap-3">
        <div class="flex-1 text-ui text-[--color-text-primary]">
          <span class="font-medium">{{ selectedBgg.name }}</span>
          <span v-if="selectedBgg.yearPublished" class="ml-2 text-[--color-text-muted]">({{ selectedBgg.yearPublished }})</span>
        </div>
        <SharedButton
          type="button"
          :pending="fetchingBgg"
          pending-label="Fetching…"
          @click="fetchBggInfo"
        >
          Fetch game info
        </SharedButton>
        <button
          type="button"
          class="text-ui text-[--color-text-muted] hover:text-[--color-text-primary]"
          @click="clearBgg"
        >
          ✕
        </button>
      </div>
      <p v-if="bggError" class="mt-2 text-detail text-[--color-error]">{{ bggError }}</p>
    </div>

    <!-- Name -->
    <div class="mb-md">
      <label for="game-name" class="block text-ui font-medium text-[--color-text-secondary] mb-1">Name *</label>
      <SharedInput id="game-name" v-model="form.name" type="text" required maxlength="255" />
    </div>

    <!-- Description -->
    <div class="mb-md">
      <label for="game-description" class="block text-ui font-medium text-[--color-text-secondary] mb-1">Description</label>
      <textarea
        id="game-description"
        v-model="form.description"
        rows="3"
        maxlength="2000"
        class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-ui text-[--color-text-primary] bg-[--color-surface] focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent resize-y"
      />
    </div>

    <!-- Player count -->
    <div class="mb-md grid grid-cols-2 gap-md">
      <div>
        <label for="game-player-min" class="block text-ui font-medium text-[--color-text-secondary] mb-1">Min players *</label>
        <SharedInput id="game-player-min" v-model.number="form.playerMin" type="number" min="1" required />
      </div>
      <div>
        <label for="game-player-max" class="block text-ui font-medium text-[--color-text-secondary] mb-1">Max players *</label>
        <SharedInput id="game-player-max" v-model.number="form.playerMax" type="number" min="1" required />
      </div>
    </div>

    <!-- Play time -->
    <div class="mb-md grid grid-cols-2 gap-md">
      <div>
        <label for="game-time-min" class="block text-ui font-medium text-[--color-text-secondary] mb-1">Min time (min) *</label>
        <SharedInput id="game-time-min" v-model.number="form.timeMin" type="number" min="1" required />
      </div>
      <div>
        <label for="game-time-max" class="block text-ui font-medium text-[--color-text-secondary] mb-1">Max time (min) *</label>
        <SharedInput id="game-time-max" v-model.number="form.timeMax" type="number" min="1" required />
      </div>
    </div>

    <!-- Featured -->
    <div class="mb-md">
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.featured" type="checkbox" class="rounded border-[--color-border]" />
        <span class="text-ui font-medium text-[--color-text-secondary]">Featured game</span>
      </label>
      <div v-if="form.featured" class="mt-2">
        <SharedInput
          :model-value="form.featuredNote ?? undefined"
          type="text"
          maxlength="500"
          placeholder="Optional note shown with featured game"
          @update:model-value="(v) => { form.featuredNote = String(v) }"
        />
      </div>
    </div>

    <!-- Tags -->
    <div class="mb-lg">
      <label class="block text-ui font-medium text-[--color-text-secondary] mb-1">Tags</label>
      <StaffTagTypeahead
        v-model="selectedTags"
        :available-tags="availableTags"
      />
    </div>

    <!-- Photos -->
    <div class="mb-lg">
      <label class="block text-ui font-medium text-[--color-text-secondary] mb-2">Photos</label>

      <!-- BGG image candidates -->
      <div v-if="bggImages.length > 0 && savedGameId" class="mb-3">
        <p class="text-detail text-[--color-text-muted] mb-2">Click a BGG image to attach it:</p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="url in bggImages"
            :key="url"
            type="button"
            :disabled="attachingBggImage === url"
            class="relative rounded-[--radius-md] overflow-hidden border-2 border-[--color-border] hover:border-[--color-brand] transition-colors disabled:opacity-50"
            @click="attachBggImage(url)"
          >
            <img :src="url" alt="BGG image" class="w-24 h-24 object-cover" loading="lazy" />
          </button>
        </div>
        <p v-if="bggImageError" class="mt-1 text-detail text-[--color-error]">{{ bggImageError }}</p>
      </div>
      <div v-else-if="bggImages.length > 0 && !savedGameId" class="mb-3">
        <p class="text-detail text-[--color-text-muted]">Save the game first to attach the BGG image.</p>
      </div>

      <StaffPhotoUpload
        v-if="savedGameId"
        ref="photoUpload"
        :game-id="savedGameId"
        :existing-photos="existingPhotoHashes"
        @uploaded="onPhotosUploaded"
      />
      <p v-else-if="bggImages.length === 0" class="text-ui text-[--color-text-muted]">Save the game first, then add photos.</p>
    </div>

    <p v-if="error" class="text-ui text-[--color-error] mb-md">{{ error }}</p>

    <div class="flex items-center gap-3">
      <SharedButton
        type="submit"
        :pending="pending"
        pending-label="Saving…"
      >
        {{ submitLabel }}
      </SharedButton>
      <NuxtLink to="/staff" class="text-ui text-[--color-text-secondary] hover:text-[--color-text-primary]">
        Cancel
      </NuxtLink>
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
  submitLabel?: string
}>()

const emit = defineEmits<{
  saved: [gameId: number]
}>()

const submitLabel = computed(() => props.submitLabel ?? 'Save game')

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
}

function clearBgg() {
  selectedBgg.value = null
  bggImages.value = []
  bggError.value = ''
  bggId.value = null
}

async function fetchBggInfo() {
  if (!selectedBgg.value) return
  fetchingBgg.value = true
  bggError.value = ''
  try {
    const detail = await $fetch<BggThingDetail>(`/api/bgg/thing/${selectedBgg.value.bggId}`)
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
    error.value = 'Something went wrong. Please try again.'
    console.error(err)
  } finally {
    pending.value = false
  }
}

function onPhotosUploaded(hashes: string[]) {
  existingPhotoHashes.value = [...existingPhotoHashes.value, ...hashes]
}
</script>
