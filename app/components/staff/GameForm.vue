<template>
  <form @submit.prevent="submit">
    <!-- Name -->
    <div class="mb-4">
      <label for="game-name" class="block text-sm font-medium text-[--color-text-secondary] mb-1">Name *</label>
      <input
        id="game-name"
        v-model="form.name"
        type="text"
        required
        maxlength="255"
        class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
      />
    </div>

    <!-- Description -->
    <div class="mb-4">
      <label for="game-description" class="block text-sm font-medium text-[--color-text-secondary] mb-1">Description</label>
      <textarea
        id="game-description"
        v-model="form.description"
        rows="3"
        maxlength="2000"
        class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent resize-y"
      />
    </div>

    <!-- Player count -->
    <div class="mb-4 grid grid-cols-2 gap-4">
      <div>
        <label for="game-player-min" class="block text-sm font-medium text-[--color-text-secondary] mb-1">Min players *</label>
        <input
          id="game-player-min"
          v-model.number="form.playerMin"
          type="number"
          min="1"
          required
          class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
        />
      </div>
      <div>
        <label for="game-player-max" class="block text-sm font-medium text-[--color-text-secondary] mb-1">Max players *</label>
        <input
          id="game-player-max"
          v-model.number="form.playerMax"
          type="number"
          min="1"
          required
          class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
        />
      </div>
    </div>

    <!-- Play time -->
    <div class="mb-4 grid grid-cols-2 gap-4">
      <div>
        <label for="game-time-min" class="block text-sm font-medium text-[--color-text-secondary] mb-1">Min time (min) *</label>
        <input
          id="game-time-min"
          v-model.number="form.timeMin"
          type="number"
          min="1"
          required
          class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
        />
      </div>
      <div>
        <label for="game-time-max" class="block text-sm font-medium text-[--color-text-secondary] mb-1">Max time (min) *</label>
        <input
          id="game-time-max"
          v-model.number="form.timeMax"
          type="number"
          min="1"
          required
          class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
        />
      </div>
    </div>

    <!-- Featured -->
    <div class="mb-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.featured" type="checkbox" class="rounded border-[--color-border]" />
        <span class="text-sm font-medium text-[--color-text-secondary]">Featured game</span>
      </label>
      <div v-if="form.featured" class="mt-2">
        <input
          v-model="form.featuredNote"
          type="text"
          maxlength="500"
          placeholder="Optional note shown with featured game"
          class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-sm text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
        />
      </div>
    </div>

    <!-- Tags -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-[--color-text-secondary] mb-1">Tags</label>
      <StaffTagTypeahead
        v-model="selectedTags"
        :available-tags="availableTags"
      />
    </div>

    <!-- Photos -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-[--color-text-secondary] mb-2">Photos</label>
      <StaffPhotoUpload
        v-if="savedGameId"
        ref="photoUpload"
        :game-id="savedGameId"
        :existing-photos="existingPhotoHashes"
        @uploaded="onPhotosUploaded"
      />
      <p v-else class="text-sm text-[--color-text-muted]">Save the game first, then add photos.</p>
    </div>

    <p v-if="error" class="text-sm text-[--color-error] mb-4">{{ error }}</p>

    <div class="flex items-center gap-3">
      <button
        type="submit"
        :disabled="pending"
        class="bg-[--color-brand] hover:bg-[--color-brand-hover] disabled:opacity-60 text-white text-sm font-medium rounded-[--radius-md] px-5 py-2 transition-colors"
      >
        {{ pending ? 'Saving…' : submitLabel }}
      </button>
      <NuxtLink to="/staff" class="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary]">
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TagOption } from './TagTypeahead.vue'

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

// Tags: split initial tagIds into existing tag objects
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
    }

    if (savedGameId.value) {
      // Edit
      await $fetch(`/api/staff/games/${savedGameId.value}`, { method: 'PATCH', body })
    } else {
      // Create
      const result = await $fetch<{ id: number }>('/api/staff/games', { method: 'POST', body })
      savedGameId.value = result.id
    }

    // Upload any queued photos
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
