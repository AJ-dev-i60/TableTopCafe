<script setup lang="ts">
// Full-screen photo viewer. Controlled via v-model: the index of the photo to
// show, or null when closed. Navigation (arrows, dots, swipe, ←/→ keys) cycles
// through all of `photos` with a directional slide animation. The image itself
// is zoomable — pinch, double-tap, or mouse wheel — and pans when zoomed,
// without zooming the page (the stage swallows native touch gestures).
const props = defineProps<{
  modelValue: number | null
  photos: { id: number; contentHash: string }[]
  gameName: string
  // Staff mode: show a rotate/delete toolbar and emit edit events.
  editable?: boolean
  // Disables the toolbar and shows a spinner while an edit is in flight.
  busy?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  rotate: [index: number, direction: 'cw' | 'ccw']
  delete: [index: number]
}>()

const MAX_SCALE = 3
const DOUBLE_TAP_SCALE = 2.5

const dialogEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const imgEl = ref<HTMLImageElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const count = computed(() => props.photos.length)
const current = computed(() =>
  props.modelValue === null ? null : props.photos[props.modelValue] ?? null,
)

// Zoom / pan state.
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const animating = ref(false)

const slideName = ref<'slide-next' | 'slide-prev'>('slide-next')

const imgStyle = computed(() => ({
  transform: `translate3d(${tx.value}px, ${ty.value}px, 0) scale(${scale.value})`,
  transition: animating.value ? 'transform 200ms ease' : 'none',
  cursor: scale.value > 1 ? 'grab' : 'zoom-in',
}))

function photoUrl(hash: string, ext: 'webp' | 'jpg') {
  return `/api/photos/${hash}/detail.${ext}`
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

function close() {
  emit('update:modelValue', null)
}

function select(i: number) {
  if (props.modelValue === null || i === props.modelValue) return
  slideName.value = i > props.modelValue ? 'slide-next' : 'slide-prev'
  emit('update:modelValue', i)
}

// Wrap around so swiping/arrowing past either end loops, carousel-style.
function go(delta: number) {
  if (props.modelValue === null || count.value < 2) return
  slideName.value = delta > 0 ? 'slide-next' : 'slide-prev'
  emit('update:modelValue', (props.modelValue + delta + count.value) % count.value)
}

// ── Zoom ──────────────────────────────────────────────────────────────────
// Keep the focal point (cursor / pinch midpoint) pinned while scaling.
function zoomTo(newScale: number, focalClientX: number, focalClientY: number) {
  const stage = stageEl.value
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  const cx = focalClientX - (rect.left + rect.width / 2)
  const cy = focalClientY - (rect.top + rect.height / 2)
  const s0 = scale.value
  const pointX = (cx - tx.value) / s0
  const pointY = (cy - ty.value) / s0
  scale.value = clamp(newScale, 1, MAX_SCALE)
  tx.value = cx - pointX * scale.value
  ty.value = cy - pointY * scale.value
  clampPan()
}

function clampPan() {
  const img = imgEl.value
  const stage = stageEl.value
  if (!img || !stage) return
  const maxX = Math.max(0, (img.clientWidth * scale.value - stage.clientWidth) / 2)
  const maxY = Math.max(0, (img.clientHeight * scale.value - stage.clientHeight) / 2)
  tx.value = clamp(tx.value, -maxX, maxX)
  ty.value = clamp(ty.value, -maxY, maxY)
}

function resetZoom() {
  animating.value = true
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

function toggleZoom(clientX: number, clientY: number) {
  animating.value = true
  if (scale.value > 1) resetZoom()
  else zoomTo(DOUBLE_TAP_SCALE, clientX, clientY)
}

function onWheel(e: WheelEvent) {
  animating.value = false
  const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2
  const next = clamp(scale.value * factor, 1, MAX_SCALE)
  if (next === scale.value) return
  zoomTo(next, e.clientX, e.clientY)
  if (next <= 1.001) resetZoom()
}

// ── Touch gestures ──────────────────────────────────────────────────────────
let pinchLastDist = 0
let panning = false
let panStartX = 0
let panStartY = 0
let panStartTx = 0
let panStartTy = 0
let tapStartX = 0
let tapStartY = 0
let didPinch = false
let didPan = false
let lastTapTime = 0

function touchDist(a: Touch, b: Touch) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
}

function onTouchStart(e: TouchEvent) {
  animating.value = false
  if (e.touches.length === 2) {
    pinchLastDist = touchDist(e.touches[0], e.touches[1])
    didPinch = false
    panning = false
    return
  }
  if (e.touches.length === 1) {
    const t = e.touches[0]
    tapStartX = t.clientX
    tapStartY = t.clientY
    didPan = false
    didPinch = false
    panning = false
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length >= 2) {
    const dist = touchDist(e.touches[0], e.touches[1])
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    if (pinchLastDist === 0) {
      pinchLastDist = dist
      return
    }
    animating.value = false
    didPinch = true
    zoomTo(scale.value * (dist / pinchLastDist), midX, midY)
    pinchLastDist = dist
    return
  }
  if (e.touches.length === 1 && scale.value > 1) {
    const t = e.touches[0]
    if (!panning) {
      // Deadzone: ignore micro-jitter so a stationary touch stays a tap — keeps
      // double-tap-to-zoom-out reliable while zoomed in.
      if (Math.hypot(t.clientX - tapStartX, t.clientY - tapStartY) < 6) return
      panning = true
      panStartX = t.clientX
      panStartY = t.clientY
      panStartTx = tx.value
      panStartTy = ty.value
    }
    didPan = true
    animating.value = false
    tx.value = panStartTx + (t.clientX - panStartX)
    ty.value = panStartTy + (t.clientY - panStartY)
    clampPan()
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length >= 2) return
  pinchLastDist = 0
  if (e.touches.length > 0) return

  const wasPinch = didPinch
  panning = false
  didPan = false
  didPinch = false

  if (wasPinch) {
    if (scale.value <= 1.02) resetZoom()
    return
  }

  // Classify by net movement, not the pan flag: a near-stationary finger is a
  // tap even if a pixel of pan slipped through — so double-tap always toggles.
  const t = e.changedTouches[0]
  const dx = t.clientX - tapStartX
  const dy = t.clientY - tapStartY
  if (Math.hypot(dx, dy) < 12) {
    const now = Date.now()
    if (now - lastTapTime < 300) {
      lastTapTime = 0
      toggleZoom(t.clientX, t.clientY)
    } else {
      lastTapTime = now
    }
    return
  }

  // A real drag: navigate only when not zoomed (otherwise it was a pan).
  if (scale.value === 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
    go(dx < 0 ? 1 : -1)
  }
}

// ── Mouse (desktop) ───────────────────────────────────────────────────────
function onDblClick(e: MouseEvent) {
  toggleZoom(e.clientX, e.clientY)
}

function onMouseDown(e: MouseEvent) {
  if (scale.value <= 1) return
  e.preventDefault()
  animating.value = false
  const startX = e.clientX
  const startY = e.clientY
  const startTx = tx.value
  const startTy = ty.value
  function move(ev: MouseEvent) {
    tx.value = startTx + (ev.clientX - startX)
    ty.value = startTy + (ev.clientY - startY)
    clampPan()
  }
  function up() {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

// ── Keyboard + focus trap ─────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (props.modelValue === null) return
  if (e.key === 'Escape') return close()
  if (e.key === 'ArrowLeft') { e.preventDefault(); return go(-1) }
  if (e.key === 'ArrowRight') { e.preventDefault(); return go(1) }
  if (e.key === 'Tab') trapTab(e)
}

function trapTab(e: KeyboardEvent) {
  const root = dialogEl.value
  if (!root) return
  const focusables = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.modelValue,
  (val, old) => {
    // Every photo change starts un-zoomed.
    scale.value = 1
    tx.value = 0
    ty.value = 0
    animating.value = false

    const opening = val !== null && old === null
    const closing = val === null && old !== null
    if (opening) {
      previouslyFocused = (document.activeElement as HTMLElement | null) ?? null
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      nextTick(() => dialogEl.value?.focus())
    } else if (closing) {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue !== null && current"
      ref="dialogEl"
      class="lb-scrim"
      role="dialog"
      aria-modal="true"
      :aria-label="`${gameName} photos`"
      tabindex="-1"
      @click="close"
    >
      <button type="button" class="lb-btn lb-close" aria-label="Close" @click.stop="close">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div v-if="count > 1" class="lb-counter" aria-hidden="true">{{ modelValue + 1 }} / {{ count }}</div>

      <button v-if="count > 1" type="button" class="lb-btn lb-prev" aria-label="Previous photo" @click.stop="go(-1)">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- No @click.stop here: clicking the empty area around the image bubbles
           to the scrim and closes. Only the image itself stops the click. -->
      <div
        ref="stageEl"
        class="lb-stage"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
        @dblclick="onDblClick"
        @wheel.prevent="onWheel"
      >
        <Transition :name="slideName">
          <div :key="modelValue" class="lb-slide">
            <picture>
              <source type="image/webp" :srcset="photoUrl(current.contentHash, 'webp')" />
              <img
                ref="imgEl"
                :src="photoUrl(current.contentHash, 'jpg')"
                :alt="gameName"
                class="lb-img"
                :style="imgStyle"
                draggable="false"
                @click.stop
              />
            </picture>
          </div>
        </Transition>
      </div>

      <button v-if="count > 1" type="button" class="lb-btn lb-next" aria-label="Next photo" @click.stop="go(1)">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div v-if="count > 1" class="lb-dots" :class="editable ? 'lb-dots-raised' : ''">
        <button
          v-for="(photo, i) in photos"
          :key="photo.id"
          type="button"
          class="lb-dot"
          :class="i === modelValue ? 'lb-dot-active' : ''"
          :aria-label="`Go to photo ${i + 1}`"
          @click.stop="select(i)"
        />
      </div>

      <!-- Staff edit toolbar -->
      <div v-if="editable" class="lb-toolbar" @click.stop>
        <button type="button" class="lb-tool" :disabled="busy" aria-label="Rotate left" title="Rotate left" @click="emit('rotate', modelValue ?? 0, 'ccw')">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button type="button" class="lb-tool" :disabled="busy" aria-label="Rotate right" title="Rotate right" @click="emit('rotate', modelValue ?? 0, 'cw')">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button type="button" class="lb-tool lb-tool-danger" :disabled="busy" aria-label="Delete photo" title="Delete photo" @click="emit('delete', modelValue ?? 0)">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <!-- Busy overlay while a rotate/delete is in flight -->
      <div v-if="editable && busy" class="lb-busy" aria-hidden="true">
        <span class="lb-spinner" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lb-scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(8 18 14 / 0.92);
  outline: none;
  /* Swallow native pan/pinch/double-tap-zoom so gestures move the image, not the page. */
  touch-action: none;
}

.lb-stage {
  position: relative;
  flex: 1;
  align-self: stretch;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  /* touch-action isn't inherited, so the gesture surface needs it directly. */
  touch-action: none;
}

.lb-slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lb-img {
  display: block;
  max-width: 100%;
  max-height: 86vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  transform-origin: center center;
  touch-action: none;
  -webkit-user-drag: none;
}

/* Directional slide between photos */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-next-enter-from {
  transform: translateX(100%);
}
.slide-next-leave-to {
  transform: translateX(-100%);
}
.slide-prev-enter-from {
  transform: translateX(-100%);
}
.slide-prev-leave-to {
  transform: translateX(100%);
}

.lb-btn {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #fff;
  background: rgb(255 255 255 / 0.12);
  border: 1px solid rgb(255 255 255 / 0.30);
  border-radius: var(--radius-full);
  backdrop-filter: blur(10px);
  cursor: pointer;
  z-index: 1;
}
.lb-btn:hover {
  background: rgb(255 255 255 / 0.24);
}
.lb-btn:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.8);
  outline-offset: 2px;
}

.lb-close {
  top: 16px;
  right: 16px;
}
.lb-prev {
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}
.lb-next {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.lb-counter {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgb(255 255 255 / 0.85);
  font-size: var(--font-size-meta);
  font-weight: 500;
  letter-spacing: 0.02em;
  z-index: 1;
}

.lb-dots {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  z-index: 1;
}

.lb-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: rgb(255 255 255 / 0.40);
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
}
.lb-dot:hover {
  background: rgb(255 255 255 / 0.70);
}
.lb-dot-active {
  background: #fff;
  transform: scale(1.25);
}
/* Lift the dots above the edit toolbar in staff mode. */
.lb-dots-raised {
  bottom: 74px;
}

.lb-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 2;
}

.lb-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #fff;
  background: rgb(255 255 255 / 0.14);
  border: 1px solid rgb(255 255 255 / 0.30);
  border-radius: var(--radius-full);
  backdrop-filter: blur(10px);
  cursor: pointer;
}
.lb-tool:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.26);
}
.lb-tool:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.8);
  outline-offset: 2px;
}
.lb-tool:disabled {
  opacity: 0.5;
  cursor: default;
}
.lb-tool-danger:hover:not(:disabled) {
  background: rgb(220 38 38 / 0.85);
  border-color: rgb(220 38 38 / 0.9);
}

.lb-busy {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}
.lb-spinner {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 3px solid rgb(255 255 255 / 0.3);
  border-top-color: #fff;
  animation: lb-spin 0.7s linear infinite;
}
@keyframes lb-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-prev-enter-active,
  .slide-prev-leave-active {
    transition: none;
  }
  .lb-dot {
    transition: none;
  }
}
</style>
