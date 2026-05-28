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
    class="flex items-center gap-3 px-4 py-3 bg-white border-b border-[--color-border] last:border-b-0 hover:bg-[--color-surface-elevated] transition-colors duration-100"
  >
    <!-- Thumbnail -->
    <div class="shrink-0 w-12 h-12 rounded bg-[--color-surface-elevated] overflow-hidden">
      <img
        v-if="game.photoHash"
        :src="`/api/photos/${game.photoHash}/thumb.jpg`"
        :alt="game.name"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-[--color-text-muted]">
        <svg class="w-5 h-5 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span
          v-if="game.featured"
          class="shrink-0 px-1.5 py-0.5 text-xs font-semibold bg-[--color-brand] text-white rounded-full leading-tight"
        >
          Featured
        </span>
        <h2 class="text-sm font-medium text-[--color-text-primary] truncate">{{ game.name }}</h2>
      </div>
      <div class="flex items-center gap-2 mt-0.5">
        <span class="text-xs text-[--color-text-secondary]">{{ playerLabel(game.playerMin, game.playerMax) }}</span>
        <span class="text-xs text-[--color-text-muted]">·</span>
        <span class="text-xs text-[--color-text-secondary]">{{ timeLabel(game.timeMin, game.timeMax) }}</span>
      </div>
    </div>

    <!-- Tags (desktop only) -->
    <div class="hidden sm:flex items-center gap-1 shrink-0">
      <span
        v-for="tag in game.tags.slice(0, 2)"
        :key="tag.id"
        class="px-1.5 py-0.5 text-xs bg-[--color-surface-elevated] text-[--color-text-secondary] rounded border border-[--color-border]"
      >
        {{ tag.name }}
      </span>
    </div>

    <!-- Chevron -->
    <svg class="shrink-0 w-4 h-4 text-[--color-text-muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </article>
</template>
