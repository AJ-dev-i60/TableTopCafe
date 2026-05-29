<script setup lang="ts">
import type { GameListItem } from '../../../server/db/queries/games'

defineProps<{ game: GameListItem }>()

function playerLabel(min: number, max: number): string {
  return min === max ? `${min}p` : `${min}–${max}p`
}

function timeLabel(min: number, max: number): string {
  const fmt = (m: number) => (m >= 60 ? `${m / 60}h` : `${m}m`)
  return min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`
}
</script>

<template>
  <article
    class="flex items-center gap-3 px-md py-3 bg-[--color-surface] border-b border-[--color-border] last:border-b-0 hover:bg-[--color-surface-elevated] motion-safe:transition-colors motion-safe:duration-fast"
  >
    <!-- Thumbnail -->
    <div class="shrink-0 w-12 h-12 rounded-[--radius-sm] overflow-hidden">
      <img
        v-if="game.photoHash"
        :src="`/api/photos/${game.photoHash}/thumb.jpg`"
        :alt="game.name"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <!-- No-photo fallback: brand gradient + first initial -->
      <div v-else class="thumb-fallback w-full h-full flex items-center justify-center">
        <span class="text-lg font-bold text-white/50 leading-none select-none" aria-hidden="true">
          {{ game.name.charAt(0) }}
        </span>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <SharedFeaturedBadge v-if="game.featured" class="shrink-0" />
        <h2 class="text-card-title font-medium text-[--color-text-primary] truncate">{{ game.name }}</h2>
      </div>
      <div class="flex items-center gap-2 mt-0.5">
        <span class="text-meta text-[--color-text-secondary]">{{ playerLabel(game.playerMin, game.playerMax) }}</span>
        <span class="text-meta text-[--color-text-muted]">·</span>
        <span class="text-meta text-[--color-text-secondary]">{{ timeLabel(game.timeMin, game.timeMax) }}</span>
      </div>
    </div>

    <!-- Tags (desktop only) -->
    <div class="hidden sm:flex items-center gap-1 shrink-0">
      <span
        v-for="tag in game.tags.slice(0, 2)"
        :key="tag.id"
        class="px-1.5 py-0.5 text-tag bg-[--color-surface-elevated] text-[--color-text-secondary] rounded-[--radius-sm] border border-[--color-border]"
      >
        {{ tag.name }}
      </span>
    </div>

    <!-- Chevron -->
    <svg class="shrink-0 w-4 h-4 text-[--color-text-muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </article>
</template>

<style scoped>
.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}
</style>
