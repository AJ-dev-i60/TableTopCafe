<script setup lang="ts">
// Full-screen photo viewer. Controlled via v-model: the index of the photo to
// show, or null when closed. Navigation (arrows, dots, swipe, ←/→ keys) cycles
// through all of `photos` without closing — one viewer, every image.
const props = defineProps<{
  modelValue: number | null
  photos: { id: number; contentHash: string }[]
  gameName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const dialogEl = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const count = computed(() => props.photos.length)
const current = computed(() =>
  props.modelValue === null ? null : props.photos[props.modelValue] ?? null,
)

function photoUrl(hash: string, ext: 'webp' | 'jpg') {
  return `/api/photos/${hash}/detail.${ext}`
}

function close() {
  emit('update:modelValue', null)
}

function select(i: number) {
  emit('update:modelValue', i)
}

// Wrap around so swiping/arrowing past either end loops, carousel-style.
function go(delta: number) {
  if (props.modelValue === null || count.value === 0) return
  emit('update:modelValue', (props.modelValue + delta + count.value) % count.value)
}

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

// Touch swipe: horizontal drag past the threshold (and more horizontal than
// vertical, so it doesn't fight a scroll) flips one photo.
let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  const t = e.changedTouches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
}

watch(
  () => props.modelValue,
  (val, old) => {
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

      <figure class="lb-figure" @click.stop @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
        <picture>
          <source type="image/webp" :srcset="photoUrl(current.contentHash, 'webp')" />
          <img :src="photoUrl(current.contentHash, 'jpg')" :alt="gameName" class="lb-img" />
        </picture>
      </figure>

      <button v-if="count > 1" type="button" class="lb-btn lb-next" aria-label="Next photo" @click.stop="go(1)">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div v-if="count > 1" class="lb-dots">
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
}

.lb-figure {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

.lb-img {
  display: block;
  max-width: 100%;
  max-height: 86vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
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
}

.lb-dots {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 10px;
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

@media (prefers-reduced-motion: reduce) {
  .lb-dot {
    transition: none;
  }
}
</style>
