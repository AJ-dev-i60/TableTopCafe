<script setup lang="ts">
import type { GameListItem } from '../../../server/db/queries/games'

const props = defineProps<{ games: GameListItem[] }>()

const railEl = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const failed = reactive<Record<number, boolean>>({})

function photoUrl(hash: string, size: 'thumb' | 'card', ext: 'webp' | 'jpg') {
  return `/api/photos/${hash}/${size}.${ext}`
}

// Errors that fire before Vue hydrates the @error listener are lost. After
// render, sweep the strip's <img>s and flag any already in the broken state
// (complete + naturalWidth 0 + committed currentSrc). Mirrors GameCard/staff list.
function syncFailed() {
  const root = railEl.value
  if (!root) return
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-featured-id]')) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
      failed[Number(img.dataset.featuredId)] = true
    }
  }
}

let observer: IntersectionObserver | null = null

// ── Mouse drag-to-scroll (desktop). Touch keeps native scroll-snap. ──────────
let isDragging = false
let dragStartX = 0
let dragStartScroll = 0
let dragMoved = false

function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  const root = railEl.value
  if (!root) return
  isDragging = true
  dragMoved = false
  dragStartX = e.clientX
  dragStartScroll = root.scrollLeft
  root.classList.add('rail-dragging')
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  const root = railEl.value
  if (!root) return
  const dx = e.clientX - dragStartX
  if (Math.abs(dx) > 4) dragMoved = true
  root.scrollLeft = dragStartScroll - dx
}

function onPointerUp() {
  if (!isDragging) return
  isDragging = false
  railEl.value?.classList.remove('rail-dragging')
}

// A drag ends in a click; swallow it so the card under the cursor doesn't open.
function onClickCapture(e: MouseEvent) {
  if (dragMoved) {
    e.preventDefault()
    e.stopPropagation()
    dragMoved = false
  }
}

onMounted(() => {
  syncFailed()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  const root = railEl.value
  if (root && 'IntersectionObserver' in window) {
    // The most-visible card (≥60%) drives the active pagination dot.
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index)
            if (!Number.isNaN(idx)) activeIndex.value = idx
          }
        }
      },
      { root, threshold: 0.6 },
    )
    for (const child of Array.from(root.children)) observer.observe(child)
  }
})

watch(() => props.games, () => nextTick(syncFailed))

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})

function goTo(index: number) {
  const card = railEl.value?.children[index] as HTMLElement | undefined
  if (!card) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'start', block: 'nearest' })
}
</script>

<template>
  <div class="featured-strip">
    <ul
      ref="railEl"
      class="rail"
      role="list"
      @pointerdown="onPointerDown"
      @click.capture="onClickCapture"
      @dragstart.prevent
    >
      <li
        v-for="(game, index) in games"
        :key="game.id"
        :data-index="index"
        class="rail-item"
      >
        <NuxtLink :to="`/games/${game.id}`" class="fcard block">
          <!-- Photo fills the card (same pipeline as GameCard) -->
          <picture v-if="game.photoHash && !failed[game.id]" class="block absolute inset-0">
            <source
              type="image/webp"
              :srcset="`${photoUrl(game.photoHash, 'thumb', 'webp')} 200w, ${photoUrl(game.photoHash, 'card', 'webp')} 600w`"
              sizes="72vw"
            />
            <img
              :data-featured-id="game.id"
              :src="photoUrl(game.photoHash, 'card', 'jpg')"
              :srcset="`${photoUrl(game.photoHash, 'thumb', 'jpg')} 200w, ${photoUrl(game.photoHash, 'card', 'jpg')} 600w`"
              sizes="72vw"
              :alt="game.name"
              loading="lazy"
              class="w-full h-full object-cover"
              @error="failed[game.id] = true"
            />
          </picture>

          <!-- No-photo fallback: brand gradient + first initial -->
          <div v-else class="absolute inset-0 photo-fallback flex items-center justify-center">
            <span class="text-[2.5rem] font-bold leading-none select-none" style="color: rgb(255 255 255 / 0.85)" aria-hidden="true">
              {{ game.name.charAt(0) }}
            </span>
          </div>

          <!-- Scrim for white-text legibility over any photo -->
          <div class="scrim absolute inset-0" />

          <!-- Bare star: reinforcement (the section header carries the label) -->
          <svg class="featured-star absolute" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9z" />
          </svg>

          <!-- Compact title overlay (no info panel) -->
          <h3 class="ftitle absolute title-shadow line-clamp-1">{{ game.name }}</h3>
        </NuxtLink>
      </li>
    </ul>

    <!-- Pagination dots (hidden for a single featured game) -->
    <div v-if="games.length > 1" class="dots">
      <button
        v-for="(game, index) in games"
        :key="game.id"
        type="button"
        class="dot"
        :class="index === activeIndex ? 'dot-active' : ''"
        :aria-label="`Show featured game ${index + 1}`"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  gap: var(--spacing-sm);
  margin: 0;
  padding: 0 var(--spacing-md);
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--spacing-md);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.rail::-webkit-scrollbar {
  display: none;
}

/* Desktop (mouse): show a grab cursor and free up snapping while dragging. */
@media (hover: hover) and (pointer: fine) {
  .rail {
    cursor: grab;
  }
  .rail.rail-dragging {
    cursor: grabbing;
    scroll-snap-type: none;
    user-select: none;
  }
}

.rail img {
  -webkit-user-drag: none;
}

.rail-item {
  flex: 0 0 72%;
  scroll-snap-align: start;
}

.fcard {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.40);
  border-radius: var(--radius-xl);
  /* brand-tinted lift, matching GameCard's featured shadow */
  box-shadow: 0 14px 34px -10px rgb(21 128 61 / 0.5);
}
.fcard:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: no-preference) {
  .fcard {
    transition: transform 150ms;
  }
  .fcard:active {
    transform: scale(0.98);
  }
}

.photo-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.scrim {
  background: var(--scrim);
}

.featured-star {
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  width: 16px;
  height: 16px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.55));
}

.ftitle {
  left: var(--spacing-sm);
  right: var(--spacing-sm);
  bottom: var(--spacing-sm);
  color: #fff;
  font-size: var(--font-size-card-title);
  font-weight: 600;
  line-height: 1.2;
}
.title-shadow {
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
}

.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: var(--spacing-sm);
}
.dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
.dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
  transition: background-color var(--duration-fast), width var(--duration-fast), height var(--duration-fast);
}
.dot-active::before {
  width: 8px;
  height: 8px;
  background: var(--color-brand);
}
@media (prefers-reduced-motion: reduce) {
  .dot::before {
    transition: none;
  }
}
</style>
