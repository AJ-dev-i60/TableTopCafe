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

    <!-- Preview of newly selected files -->
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

    <!-- Existing photos -->
    <div v-if="existingPhotos && existingPhotos.length > 0" class="flex flex-wrap gap-3 mt-4">
      <div
        v-for="hash in existingPhotos"
        :key="hash"
        class="photo-thumb relative w-20 h-20 overflow-hidden border"
        style="border-color: var(--color-border)"
      >
        <img
          v-if="!failedPhotos[hash]"
          :data-photo-hash="hash"
          :src="`/api/photos/${hash}/thumb.webp`"
          :alt="hash"
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
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  gameId: number
  existingPhotos?: string[]
}>()

const emit = defineEmits<{
  uploaded: [hashes: string[]]
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

defineExpose({ upload })
</script>

<style scoped>
.photo-thumb {
  border-radius: var(--radius-md);
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
</style>
