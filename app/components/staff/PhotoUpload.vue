<template>
  <div>
    <!-- File input: drag-and-drop or click -->
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

    <!-- Action buttons: take a photo (mobile) + upload — together span the row -->
    <div class="flex gap-3 mt-3">
      <label class="photo-action flex-1 sm:hidden">
        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-ui font-medium">Take a photo</span>
        <input type="file" accept="image/*" capture="environment" class="hidden" @change="onFileChange" />
      </label>

      <label class="photo-action flex-1">
        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 16V4m0 0L8 8m4-4l4 4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
        </svg>
        <span class="text-ui font-medium">Upload</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="onFileChange" />
      </label>
    </div>

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

    <!-- Existing photos: tap to view/rotate/delete, click-and-hold to reorder -->
    <template v-if="localPhotos.length > 0">
      <div ref="gridEl" class="flex flex-wrap gap-3 mt-4">
        <button
          v-for="(hash, index) in localPhotos"
          :key="hash"
          type="button"
          class="photo-thumb group relative w-20 h-20 overflow-hidden border"
          :class="{ dragging: dragActive && dragIndex === index, cover: index === 0 }"
          :style="[
            { borderColor: 'var(--color-border)' },
            dragActive && dragIndex === index ? { transform: `translate(${dragDX}px, ${dragDY}px) scale(1.05)` } : null,
          ]"
          :aria-label="index === 0 ? `Photo 1 (cover)` : `Photo ${index + 1}`"
          @pointerdown="onThumbPointerDown(index, $event)"
          @contextmenu.prevent
          @click="onThumbClick(index)"
        >
          <img
            v-if="!failedPhotos[hash]"
            :data-photo-hash="hash"
            :src="`/api/photos/${hash}/thumb.webp`"
            :alt="`Photo ${index + 1}`"
            class="w-full h-full object-cover"
            draggable="false"
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

      <p v-if="localPhotos.length > 0" class="text-meta mt-2" style="color: var(--color-text-muted)">
        <template v-if="savingOrder">Saving order…</template>
        <template v-else>
          The first (outlined) image is the cover.<template v-if="localPhotos.length > 1"> Click and hold an image to drag and rearrange.</template>
        </template>
      </p>
    </template>

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
  reordered: [order: string[]]
}>()

const previews = ref<string[]>([])
const pending = ref(false)
let pendingFiles: File[] = []

// Same SSR/hydration race as GameCard.vue: errors fired before Vue hydrates
// the @error listener are lost. Sweep existing-photo <img>s after mount and
// re-sweep when the photo list changes.
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

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  input.value = '' // allow re-selecting the same file (e.g. retake)
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

// ── Drag-to-reorder state (declared before the watch below uses dragActive) ──
const gridEl = ref<HTMLElement | null>(null)
const dragActive = ref(false)
const dragIndex = ref<number | null>(null)
const savingOrder = ref(false)
// Live translate of the grabbed thumbnail so it follows the finger (then snaps
// to 0 when it crosses into a new slot).
const dragDX = ref(0)
const dragDY = ref(0)

// ── Local display order (kept in sync with the prop except mid-drag) ─────────
const localPhotos = ref<string[]>([])
watch(
  () => props.existingPhotos,
  (val) => {
    if (!dragActive.value) localPhotos.value = [...(val ?? [])]
  },
  { immediate: true },
)
watch(localPhotos, () => nextTick(syncFailedPhotos))

const existingPhotoObjects = computed(() =>
  localPhotos.value.map((hash, i) => ({ id: i, contentHash: hash })),
)

// ── View / rotate / delete ──────────────────────────────────────────────────
const lightboxIndex = ref<number | null>(null)
const photoBusy = ref(false)

function openLightbox(index: number) {
  lightboxIndex.value = index
}

async function onRotate(index: number, direction: 'cw' | 'ccw') {
  const hash = localPhotos.value[index]
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
  const hash = localPhotos.value[index]
  if (!hash || photoBusy.value) return
  if (!confirm('Delete this photo? This cannot be undone.')) return
  photoBusy.value = true
  try {
    await $fetch(`/api/staff/games/${props.gameId}/photos/${hash}`, { method: 'DELETE' })
    const remaining = localPhotos.value.length - 1
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

// ── Click-and-hold drag-to-reorder ──────────────────────────────────────────
let pressTimer: number | null = null
let pressStartX = 0
let pressStartY = 0
let lastX = 0
let lastY = 0
let suppressClick = false

function clearPressTimer() {
  if (pressTimer !== null) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function addDragListeners() {
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerCancel)
}
function removeDragListeners() {
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointercancel', onWindowPointerCancel)
}

function onThumbPointerDown(index: number, e: PointerEvent) {
  suppressClick = false
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (localPhotos.value.length < 2) return // nothing to reorder; tap still opens the lightbox
  pressStartX = e.clientX
  pressStartY = e.clientY
  clearPressTimer()
  addDragListeners()
  pressTimer = window.setTimeout(() => {
    pressTimer = null
    dragActive.value = true
    dragIndex.value = index
    dragDX.value = 0
    dragDY.value = 0
    lastX = pressStartX
    lastY = pressStartY
  }, 300)
}

// Which slot is under the pointer, ignoring the grabbed (floating) thumbnail so
// it doesn't just match itself.
function slotIndexAt(x: number, y: number): number | null {
  const grid = gridEl.value
  if (!grid) return null
  const children = Array.from(grid.children) as HTMLElement[]
  for (let i = 0; i < children.length; i++) {
    if (i === dragIndex.value) continue
    const r = children[i].getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i
  }
  return null
}

function onWindowPointerMove(e: PointerEvent) {
  if (!dragActive.value) {
    // Moved before the hold fired → it's a scroll/swipe, not a drag.
    if (pressTimer !== null && Math.hypot(e.clientX - pressStartX, e.clientY - pressStartY) > 8) {
      clearPressTimer()
      removeDragListeners()
    }
    return
  }
  // Rubber-band: the grabbed thumbnail follows the finger.
  dragDX.value += e.clientX - lastX
  dragDY.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY

  const over = slotIndexAt(e.clientX, e.clientY)
  if (over !== null && dragIndex.value !== null && over !== dragIndex.value) {
    const arr = [...localPhotos.value]
    const [item] = arr.splice(dragIndex.value, 1)
    arr.splice(over, 0, item!)
    localPhotos.value = arr
    dragIndex.value = over
    // Snap into the new slot and re-baseline the pull.
    dragDX.value = 0
    dragDY.value = 0
  }
}

function onWindowPointerUp() {
  clearPressTimer()
  removeDragListeners()
  if (!dragActive.value) return // was a tap → onThumbClick handles it
  dragActive.value = false
  dragIndex.value = null
  dragDX.value = 0
  dragDY.value = 0
  suppressClick = true // swallow the click that follows the drag
  const order = [...localPhotos.value]
  if (!sameOrder(order, props.existingPhotos ?? [])) void persistOrder(order)
}

function onWindowPointerCancel() {
  clearPressTimer()
  removeDragListeners()
  if (dragActive.value) {
    dragActive.value = false
    dragIndex.value = null
    dragDX.value = 0
    dragDY.value = 0
    localPhotos.value = [...(props.existingPhotos ?? [])] // revert
  }
}

onBeforeUnmount(removeDragListeners)

function onThumbClick(index: number) {
  if (suppressClick) {
    suppressClick = false
    return
  }
  openLightbox(index)
}

function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

async function persistOrder(order: string[]) {
  savingOrder.value = true
  try {
    await $fetch(`/api/staff/games/${props.gameId}/photos/reorder`, {
      method: 'POST',
      body: { order },
    })
    emit('reordered', order)
  } catch {
    localPhotos.value = [...(props.existingPhotos ?? [])] // revert on failure
  } finally {
    savingOrder.value = false
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
  /* We own touch gestures (tap = view, hold = drag), so no native scroll/zoom,
     and no long-press image callout/context menu getting in the way. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.photo-thumb.dragging {
  box-shadow: var(--shadow-lg);
  opacity: 0.95;
  z-index: 10;
  cursor: grabbing;
}

/* The first photo is the cover — outline the slot it sits in (offset outward so
   the dashed frame surrounds the tile rather than hugging the image). */
.photo-thumb.cover {
  outline: 2px dashed var(--color-brand);
  outline-offset: 3px;
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
.photo-thumb.dragging .thumb-overlay {
  opacity: 0;
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

.photo-action {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 120ms ease;
}
.photo-action:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
</style>
