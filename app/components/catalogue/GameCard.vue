<script setup lang="ts">
import type { GameListItem } from '../../../server/db/queries/games'

defineProps<{ game: GameListItem }>()

function photoUrl(hash: string, size: 'thumb' | 'card' | 'detail', ext: 'webp' | 'jpg') {
  return `/api/photos/${hash}/${size}.${ext}`
}

function playerLabel(min: number, max: number): string {
  return min === max ? `${min} players` : `${min}–${max} players`
}

function timeLabel(min: number, max: number): string {
  const fmt = (m: number) => (m >= 60 ? `${m / 60}h` : `${m}m`)
  return min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`
}
</script>

<template>
  <article
    class="flex flex-col bg-[--color-surface] rounded-[--radius-md] border border-[--color-border] shadow-[--shadow-sm] overflow-hidden hover:shadow-[--shadow-md] transition-shadow duration-base"
  >
    <!-- Photo -->
    <div class="relative aspect-[3/2] bg-[--color-surface-elevated] overflow-hidden">
      <picture v-if="game.photoHash">
        <source
          type="image/webp"
          :srcset="`${photoUrl(game.photoHash, 'thumb', 'webp')} 200w, ${photoUrl(game.photoHash, 'card', 'webp')} 600w`"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <img
          :src="photoUrl(game.photoHash, 'card', 'jpg')"
          :srcset="`${photoUrl(game.photoHash, 'thumb', 'jpg')} 200w, ${photoUrl(game.photoHash, 'card', 'jpg')} 600w`"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          :alt="game.name"
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </picture>
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-[--color-text-muted]"
      >
        <svg class="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Featured badge -->
      <span
        v-if="game.featured"
        class="absolute top-2 left-2 px-2 py-0.5 text-tag font-semibold bg-[--color-brand] text-[--color-brand-foreground] rounded-full"
      >
        Featured
      </span>
    </div>

    <!-- Body -->
    <div class="flex flex-col flex-1 p-3 gap-1.5">
      <h2 class="text-card-title font-semibold text-[--color-text-primary] leading-tight line-clamp-2">
        {{ game.name }}
      </h2>

      <!-- Meta row -->
      <div class="flex items-center gap-3 text-meta text-[--color-text-secondary]">
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ playerLabel(game.playerMin, game.playerMax) }}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ timeLabel(game.timeMin, game.timeMax) }}
        </span>
      </div>

      <!-- Tags -->
      <div v-if="game.tags.length > 0" class="flex flex-wrap gap-1 mt-auto pt-1">
        <span
          v-for="tag in game.tags.slice(0, 3)"
          :key="tag.id"
          class="px-1.5 py-0.5 text-tag bg-[--color-surface-elevated] text-[--color-text-secondary] rounded border border-[--color-border]"
        >
          {{ tag.name }}
        </span>
        <span
          v-if="game.tags.length > 3"
          class="px-1.5 py-0.5 text-meta text-[--color-text-muted]"
        >
          +{{ game.tags.length - 3 }}
        </span>
      </div>
    </div>
  </article>
</template>
