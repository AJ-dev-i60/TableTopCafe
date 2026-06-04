<script setup lang="ts">
import type { GameListItem } from '../../../server/db/queries/games'

defineProps<{ game: GameListItem; eager?: boolean }>()

const imageFailed = ref(false)
const imgEl = ref<HTMLImageElement | null>(null)

// Errors that fire before Vue hydrates the @error listener are lost. After
// mount, catch images that already failed: complete + naturalWidth=0 + a
// committed currentSrc (so we don't mis-flag lazy images that haven't started).
onMounted(() => {
  const el = imgEl.value
  if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) {
    imageFailed.value = true
  }
})

function photoUrl(hash: string, size: 'thumb' | 'card' | 'detail', ext: 'webp' | 'jpg') {
  return `/api/photos/${hash}/${size}.${ext}`
}

function playerLabel(min: number, max: number): string {
  return min === max ? `${min} players` : `${min}–${max} players`
}

function timeLabel(min: number, max: number): string {
  const fmt = (m: number) => {
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`
  }
  return min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`
}
</script>

<template>
  <article :class="['card relative overflow-hidden border border-white/40 motion-safe:transition-shadow motion-safe:duration-base aspect-[16/10] sm:aspect-[4/3] lg:aspect-[3/4]', game.featured ? 'card-featured' : '']">

    <!-- Photo fills the card -->
    <picture v-if="game.photoHash && !imageFailed" class="block absolute inset-0">
      <source
        type="image/webp"
        :srcset="`${photoUrl(game.photoHash, 'thumb', 'webp')} 200w, ${photoUrl(game.photoHash, 'card', 'webp')} 600w`"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <img
        ref="imgEl"
        :src="photoUrl(game.photoHash, 'card', 'jpg')"
        :srcset="`${photoUrl(game.photoHash, 'thumb', 'jpg')} 200w, ${photoUrl(game.photoHash, 'card', 'jpg')} 600w`"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        :alt="game.name"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        class="w-full h-full object-cover"
        @error="imageFailed = true"
      />
    </picture>

    <!-- No-photo fallback: brand gradient + first initial -->
    <div v-else class="absolute inset-0 photo-fallback flex items-center justify-center">
      <span class="text-[3rem] font-bold leading-none select-none" style="color: rgb(255 255 255 / 0.85)" aria-hidden="true">
        {{ game.name.charAt(0) }}
      </span>
    </div>

    <!-- Scrim: mandatory for white text legibility over any photo -->
    <div class="scrim absolute inset-0" />

    <!-- Featured badge -->
    <SharedFeaturedBadge v-if="game.featured" class="absolute top-2 left-2" />

    <!-- Info panel: docked bottom, frosted glass -->
    <div class="info-panel absolute left-2 right-2 bottom-2 border border-white/28 p-2.5 text-white">
      <h2 class="text-card-title font-semibold leading-tight line-clamp-2 title-shadow">
        {{ game.name }}
      </h2>

      <!-- Meta row — large 19px icons per spec -->
      <div class="flex items-center gap-4 mt-1 text-meta text-white/80">
        <span class="flex items-center gap-1">
          <svg class="w-[19px] h-[19px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ playerLabel(game.playerMin, game.playerMax) }}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-[19px] h-[19px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ timeLabel(game.timeMin, game.timeMax) }}
        </span>
      </div>

      <!-- Up to 3 tags -->
      <div v-if="game.tags.length > 0" class="flex flex-wrap gap-1 mt-1.5">
        <span
          v-for="tag in game.tags.slice(0, 3)"
          :key="tag.id"
          class="tag-pill px-1.5 py-0.5 text-tag bg-white/20 border border-white/25 text-white/90"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  /* Skip layout/paint/compositing (incl. the scrim + backdrop-filter panel) for
     off-screen cards — the big scroll-perf win on low-end Android for the
     ~400-game catalogue. The card's explicit aspect-ratio still resolves the box
     height while contents are skipped, so the grid never reflows on scroll;
     contain-intrinsic-size is only the pre-first-render fallback. */
  content-visibility: auto;
  contain-intrinsic-size: auto 300px;
}

.card-featured {
  box-shadow: 0 14px 34px -10px rgb(21 128 61 / 0.5);
}

.card:hover {
  box-shadow: var(--shadow-lg), 0 20px 40px -15px rgb(21 48 36 / 0.6);
}

.photo-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.scrim {
  background: var(--scrim);
}

.info-panel {
  background: var(--glass-fill-overlay);
  backdrop-filter: blur(var(--glass-blur-card)) saturate(140%);
  border-radius: var(--radius-md);
}

.tag-pill {
  border-radius: var(--radius-sm);
}

.title-shadow {
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
}
</style>
