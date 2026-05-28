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

useSeoMeta({
  title: () => game.value ? `${game.value.name} — TableTopCafe` : 'TableTopCafe',
  ogTitle: () => game.value?.name ?? 'TableTopCafe',
  description: () => game.value?.description ?? undefined,
})
</script>

<template>
  <div v-if="game" class="max-w-3xl mx-auto px-4 py-8">
    <!-- Back link -->
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1.5 text-sm text-[--color-text-secondary] hover:text-[--color-brand] mb-6 group"
    >
      <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      All games
    </NuxtLink>

    <!-- Photo gallery -->
    <div v-if="game.photos.length > 0" class="mb-6 rounded-[--radius-xl] overflow-hidden bg-[--color-surface-elevated]">
      <picture>
        <source
          type="image/webp"
          :srcset="`${photoUrl(game.photos[0].contentHash, 'card', 'webp')} 600w, ${photoUrl(game.photos[0].contentHash, 'detail', 'webp')} 1200w`"
          sizes="(max-width: 768px) 100vw, 768px"
        />
        <img
          :src="photoUrl(game.photos[0].contentHash, 'detail', 'jpg')"
          :alt="game.name"
          class="w-full max-h-96 object-cover"
        />
      </picture>
    </div>
    <div
      v-else
      class="mb-6 rounded-[--radius-xl] bg-[--color-surface-elevated] aspect-video flex items-center justify-center text-[--color-text-muted]"
    >
      <svg class="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>

    <!-- Header -->
    <div class="flex items-start gap-3 mb-4">
      <div class="flex-1">
        <div v-if="game.featured" class="mb-2">
          <span class="px-2.5 py-1 text-xs font-semibold bg-[--color-brand] text-white rounded-full">
            Featured
          </span>
          <p v-if="game.featuredNote" class="mt-1.5 text-sm text-[--color-text-secondary] italic">
            {{ game.featuredNote }}
          </p>
        </div>
        <h1 class="text-2xl font-bold text-[--color-text-primary]">{{ game.name }}</h1>
      </div>
    </div>

    <!-- Quick facts -->
    <div class="flex flex-wrap gap-4 mb-6 pb-6 border-b border-[--color-border]">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">Players</span>
        <span class="text-sm font-semibold text-[--color-text-primary]">{{ playerLabel(game.playerMin, game.playerMax) }}</span>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">Play time</span>
        <span class="text-sm font-semibold text-[--color-text-primary]">{{ timeLabel(game.timeMin, game.timeMax) }}</span>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="game.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
      <span
        v-for="tag in game.tags"
        :key="tag.id"
        class="px-3 py-1 text-sm bg-[--color-surface-elevated] text-[--color-text-secondary] rounded-full border border-[--color-border]"
      >
        {{ tag.name }}
      </span>
    </div>

    <!-- Description -->
    <p v-if="game.description" class="text-[--color-text-primary] leading-relaxed">
      {{ game.description }}
    </p>

    <!-- Additional photos (if more than one) -->
    <div
      v-if="game.photos.length > 1"
      class="grid grid-cols-3 gap-2 mt-6"
    >
      <div
        v-for="photo in game.photos.slice(1)"
        :key="photo.id"
        class="rounded-[--radius-md] overflow-hidden aspect-square bg-[--color-surface-elevated]"
      >
        <picture>
          <source
            type="image/webp"
            :src="photoUrl(photo.contentHash, 'thumb', 'webp')"
          />
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
</template>
