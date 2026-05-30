<script setup lang="ts">
import type { GameDetail } from '../../../server/db/queries/games'

const route = useRoute()
const id = Number(route.params.id)

const { data: game, error } = await useAsyncData<GameDetail>(
  `game-${id}`,
  () => $fetch(`/api/games/${id}`),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Game not found' })
}

function photoUrl(hash: string, size: 'thumb' | 'card' | 'detail', ext: 'webp' | 'jpg') {
  return `/api/photos/${hash}/${size}.${ext}`
}

function playerLabel(min: number, max: number): string {
  return min === max ? `${min} player${min > 1 ? 's' : ''}` : `${min}–${max} players`
}

function timeLabel(min: number, max: number): string {
  const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}` : `${m} min`)
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
}

const primaryPhotoHash = computed(() => game.value?.photos[0]?.contentHash ?? null)
const heroImageFailed = ref(false)
const heroImgEl = ref<HTMLImageElement | null>(null)

// See GameCard.vue: catches errors that fired before hydration.
onMounted(() => {
  const el = heroImgEl.value
  if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) {
    heroImageFailed.value = true
  }
})

useSeoMeta({
  title: () => game.value ? `${game.value.name} — TableTopCafe` : 'TableTopCafe',
  ogTitle: () => game.value?.name ?? 'TableTopCafe',
  description: () => game.value?.description ?? undefined,
})
</script>

<template>
  <div v-if="game" class="max-w-7xl mx-auto px-md lg:px-xl py-lg">
    <div class="lg:grid lg:gap-8 lg:items-start detail-grid">

      <!-- ── Hero column ─────────────────────────────────────── -->
      <div class="hero-col mb-6 lg:mb-0">
        <div class="hero-card relative overflow-hidden">

          <!-- Photo -->
          <picture v-if="primaryPhotoHash && !heroImageFailed" class="block absolute inset-0">
            <source
              type="image/webp"
              :srcset="`${photoUrl(primaryPhotoHash, 'card', 'webp')} 600w, ${photoUrl(primaryPhotoHash, 'detail', 'webp')} 1200w`"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <img
              ref="heroImgEl"
              :src="photoUrl(primaryPhotoHash, 'detail', 'jpg')"
              :alt="game.name"
              class="w-full h-full object-cover"
              @error="heroImageFailed = true"
            />
          </picture>

          <!-- No-photo fallback -->
          <div v-else class="absolute inset-0 photo-fallback flex items-center justify-center">
            <span class="text-[5.5rem] font-bold leading-none select-none" style="color: rgb(255 255 255 / 0.85)" aria-hidden="true">
              {{ game.name.charAt(0) }}
            </span>
          </div>

          <!-- Scrim -->
          <div class="scrim absolute inset-0" />

          <!-- Back pill: glass, top-left -->
          <NuxtLink
            to="/"
            class="back-pill absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-ui font-medium text-white focus:outline-none focus-visible:ring-2"
            style="--tw-ring-color: rgb(255 255 255 / 0.7)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Catalogue
          </NuxtLink>

          <!-- Featured badge: top-right -->
          <SharedFeaturedBadge v-if="game.featured" class="absolute top-3 right-3" />

          <!-- Title + meta: overlaid bottom-left -->
          <div class="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
            <h1 class="text-detail-title font-bold text-white leading-tight title-shadow">
              {{ game.name }}
            </h1>
            <div class="flex flex-wrap items-center gap-4 mt-2 text-meta text-white/80">
              <span class="flex items-center gap-1.5">
                <svg class="w-[19px] h-[19px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ playerLabel(game.playerMin, game.playerMax) }}
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-[19px] h-[19px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ timeLabel(game.timeMin, game.timeMax) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Content panels column ───────────────────────────── -->
      <div class="flex flex-col gap-4">

        <!-- Staff pick note -->
        <div
          v-if="game.featured && game.featuredNote"
          class="staff-pick-panel p-4"
        >
          <div class="flex items-start gap-2.5">
            <svg class="w-[18px] h-[18px] shrink-0 mt-0.5" style="color: var(--color-brand)" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9z"/>
            </svg>
            <div>
              <div class="text-section-label font-semibold uppercase tracking-wider mb-1" style="color: var(--color-brand)">Staff pick</div>
              <p class="text-ui leading-relaxed" style="color: var(--color-text-primary)">{{ game.featuredNote }}</p>
            </div>
          </div>
        </div>

        <!-- About this game -->
        <div v-if="game.description" class="glass-panel p-4 lg:p-5">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">About this game</h2>
          <p class="text-body leading-relaxed" style="color: var(--color-text-primary)">{{ game.description }}</p>
        </div>

        <!-- Tags -->
        <div v-if="game.tags.length > 0" class="glass-panel p-4">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">Tags</h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in game.tags"
              :key="tag.id"
              class="tag-pill px-3 py-1 text-ui border"
              style="background: rgb(255 255 255 / 0.50); color: var(--color-text-secondary); border-color: var(--glass-stroke)"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <!-- More photos -->
        <div v-if="game.photos.length > 1" class="glass-panel p-4">
          <h2 class="text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">More photos</h2>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="photo in game.photos.slice(1)"
              :key="photo.id"
              class="photo-thumb overflow-hidden aspect-square"
              style="background: var(--color-surface-elevated)"
            >
              <picture>
                <source type="image/webp" :srcset="photoUrl(photo.contentHash, 'thumb', 'webp')" />
                <img
                  :src="photoUrl(photo.contentHash, 'thumb', 'jpg')"
                  :alt="game.name"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
              </picture>
            </div>
          </div>
        </div>

        <!-- Availability note -->
        <p class="text-ui text-center py-2 px-4" style="color: var(--color-text-secondary)">
          This is our library — not real-time availability.
          Ask a staff member to grab a game for you.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-grid {
  grid-template-columns: 1.15fr 1fr;
}

@media (min-width: 1024px) {
  .hero-col {
    position: sticky;
    top: calc(var(--header-height) + 1.5rem);
  }
}

.hero-card {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-xl);
}

.photo-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.scrim {
  background: var(--scrim);
}

.glass-panel {
  background: var(--glass-fill);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-radius: var(--radius-xl);
}

.staff-pick-panel {
  background: rgb(21 128 61 / 0.10);
  border: 1px solid rgb(21 128 61 / 0.28);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-radius: var(--radius-xl);
}

.back-pill {
  background: rgb(255 255 255 / 0.16);
  border: 1px solid rgb(255 255 255 / 0.40);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-full);
}

.title-shadow {
  text-shadow: 0 1px 4px rgb(0 0 0 / 0.6);
}

.tag-pill {
  border-radius: var(--radius-full);
}

.photo-thumb {
  border-radius: var(--radius-md);
}
</style>
