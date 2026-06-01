<template>
  <div>
    <!-- File input (above existing photos) -->
    <label
      class="dropzone flex flex-col items-center justify-center w-full h-28 border-2 border-dashed transition-colors"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <span class="text-ui" style="color: var(--color-text-muted)">
        {{ pending ? 'Uploading…' : 'Click or drag photos here' }}
      </span>
      <span class="text-meta mt-1" style="color: var(--color-text-muted)">JPEG, PNG, WebP</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        class="hidden"
        @change="onFileChange"
      />
    </label>

    <!-- Take a photo (mobile: opens the camera) -->
    <label class="camera-btn sm:hidden flex items-center justify-center gap-2 w-full mt-2 py-2.5 text-ui font-medium">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Take a photo
      <input
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="onFileChange"
      />
    </label>

    <!-- Preview of newly selected files (upload on save) -->
    <div v-if="previews.length > 0" class="flex flex-wrap gap-3 mt-3">
      <div
        v-for="(src, i) in previews"
        :key="i"
        class="photo-thumb relative w-20 h-20 overflow-hidden border"
        style="border-color: var(--color-border)"
      >
        <img :src="src" class="w-full h-full object-cover" />
      </div>
    </div>

    <!-- Existing photos: click to view / rotate / delete -->
    <div v-if="existingPhotos && existingPhotos.length > 0" class="flex flex-wrap gap-3 mt-4">
      <button
        v-for="(hash, index) in existingPhotos"
        :key="hash"
        type="button"
        class="photo-thumb group relative w-20 h-20 overflow-hidden border"
        style="border-color: var(--color-border)"
        :aria-label="`View photo ${index + 1}`"
        @click="openLightbox(index)"
      >
        <img
          v-if="!failedPhotos[hash]"
          :data-photo-hash="hash"
          :src="`/api/photos/${hash}/thumb.webp`"
          :alt="`Photo ${index + 1}`"
          class="w-full h-full object-cover"
          @error="failedPhotos[hash] = true"
        />
        <div
          v-else
          class="photo-missing w-full h-full flex items-center justify-center"
          :title="`Photo file missing: ${hash}`"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3l18 18M4 4h16v16H4z M4 16l5-5 3 3 M14 14l1-1 5 5" />
          </svg>
        </div>
        <span class="thumb-overlay absolute inset-0 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2" />
          </svg>
        </span>
      </button>
    </div>

    <CataloguePhotoLightbox
      v-model="lightboxIndex"
      :photos="existingPhotoObjects"
      :game-name="gameName ?? 'Photo'"
      editable
      :busy="photoBusy"
      @rotate="onRotate"
      @delete="onDelete"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  gameId: number
  existingPhotos?: string[]
  gameName?: string
}>()

const emit = defineEmits<{
  uploaded: [hashes: string[]]
  deleted: [hash: string]
  rotated: [payload: { oldHash: string; newHash: string }]
}>()

const previews = ref<string[]>([])
const pending = ref(false)
let pendingFiles: File[] = []

// Same SSR/hydration race as GameCard.vue: errors fired before Vue hydrates
// the @error listener are lost. Sweep existing-photo <img>s after mount and
// re-sweep when the existingPhotos prop changes (after upload).
const failedPhotos = reactive<Record<string, boolean>>({})

function syncFailedPhotos() {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-photo-hash]')) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
      const hash = img.dataset.photoHash
      if (hash) failedPhotos[hash] = true
    }
  }
}

onMounted(syncFailedPhotos)
watch(() => props.existingPhotos, () => nextTick(syncFailedPhotos))

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  // Allow re-selecting the same file (e.g. retake a photo).
  input.value = ''
}

function onDrop(e: DragEvent) {
  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
  addFiles(files)
}

function addFiles(files: File[]) {
  pendingFiles = [...pendingFiles, ...files]
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') previews.value.push(e.target.result)
    }
    reader.readAsDataURL(file)
  }
}

async function upload(): Promise<void> {
  if (pendingFiles.length === 0) return
  pending.value = true
  try {
    const fd = new FormData()
    for (const file of pendingFiles) fd.append('photos', file)
    const result = await $fetch<{ hashes: string[] }>(`/api/staff/games/${props.gameId}/photos`, {
      method: 'POST',
      body: fd,
    })
    emit('uploaded', result.hashes)
    pendingFiles = []
    previews.value = []
  } finally {
    pending.value = false
  }
}

// ── View / rotate / delete existing photos ──────────────────────────────────
const lightboxIndex = ref<number | null>(null)
const photoBusy = ref(false)

const existingPhotoObjects = computed(() =>
  (props.existingPhotos ?? []).map((hash, i) => ({ id: i, contentHash: hash })),
)

function openLightbox(index: number) {
  lightboxIndex.value = index
}

async function onRotate(index: number, direction: 'cw' | 'ccw') {
  const hash = props.existingPhotos?.[index]
  if (!hash || photoBusy.value) return
  photoBusy.value = true
  try {
    const res = await $fetch<{ hash: string }>(
      `/api/staff/games/${props.gameId}/photos/${hash}/rotate`,
      { method: 'POST', body: { direction } },
    )
    delete failedPhotos[hash]
    emit('rotated', { oldHash: hash, newHash: res.hash })
  } catch {
    // Leave the photo as-is; the staffer can retry.
  } finally {
    photoBusy.value = false
  }
}

async function onDelete(index: number) {
  const hash = props.existingPhotos?.[index]
  if (!hash || photoBusy.value) return
  if (!confirm('Delete this photo? This cannot be undone.')) return
  photoBusy.value = true
  try {
    await $fetch(`/api/staff/games/${props.gameId}/photos/${hash}`, { method: 'DELETE' })
    const remaining = (props.existingPhotos?.length ?? 1) - 1
    emit('deleted', hash)
    if (remaining <= 0) lightboxIndex.value = null
    else if (lightboxIndex.value !== null && lightboxIndex.value >= remaining) {
      lightboxIndex.value = remaining - 1
    }
  } catch {
    // Keep the lightbox open so the staffer can retry.
  } finally {
    photoBusy.value = false
  }
}

defineExpose({ upload })
</script>

<style scoped>
.photo-thumb {
  border-radius: var(--radius-md);
}

.photo-thumb.group {
  cursor: pointer;
}

.thumb-overlay {
  background: rgb(8 18 14 / 0.45);
  opacity: 0;
  transition: opacity 120ms ease;
}
.photo-thumb.group:hover .thumb-overlay,
.photo-thumb.group:focus-visible .thumb-overlay {
  opacity: 1;
}

.photo-missing {
  background: var(--color-surface-elevated);
  color: var(--color-text-muted);
}

.dropzone {
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer;
}
.dropzone:hover {
  border-color: var(--color-brand);
}

.camera-btn {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.camera-btn:hover {
  border-color: var(--color-brand);
}
</style>
