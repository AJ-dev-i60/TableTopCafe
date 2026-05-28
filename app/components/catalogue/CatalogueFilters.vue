<script setup lang="ts">
import type { TagItem } from '../../../server/db/queries/tags'
import type { PlayerCountFilter, TimeFilter } from '../../composables/useFilters'

defineProps<{
  tags: TagItem[]
  selectedTagIds: number[]
  playerCount: PlayerCountFilter
  timeFilter: TimeFilter
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:playerCount': [value: PlayerCountFilter]
  'update:timeFilter': [value: TimeFilter]
  'toggleTag': [id: number]
  'clearFilters': []
}>()

const PLAYER_OPTIONS: Array<{ label: string; value: PlayerCountFilter }> = [
  { label: 'Any', value: null },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6+', value: 6 },
]

const TIME_OPTIONS: Array<{ label: string; value: TimeFilter }> = [
  { label: 'Any', value: 'any' },
  { label: 'Under 30m', value: 'under30' },
  { label: 'Under 1h', value: 'under60' },
  { label: 'Under 90m', value: 'under90' },
  { label: 'Under 2h', value: 'under120' },
  { label: '2h+', value: 'over120' },
]
</script>

<template>
  <aside class="flex flex-col gap-5">
    <!-- Clear filters -->
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-[--color-text-primary]">Filters</h2>
      <button
        v-if="hasActiveFilters"
        class="text-xs text-[--color-brand] hover:underline"
        @click="emit('clearFilters')"
      >
        Clear all
      </button>
    </div>

    <!-- Player count -->
    <section>
      <h3 class="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide mb-2">Players</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in PLAYER_OPTIONS"
          :key="opt.label"
          :class="[
            'px-2.5 py-1 text-xs rounded-full border transition-colors duration-100',
            playerCount === opt.value
              ? 'bg-[--color-brand] border-[--color-brand] text-white'
              : 'border-[--color-border] text-[--color-text-secondary] hover:border-[--color-brand] hover:text-[--color-brand]',
          ]"
          @click="emit('update:playerCount', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Play time -->
    <section>
      <h3 class="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide mb-2">Play time</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in TIME_OPTIONS"
          :key="opt.value"
          :class="[
            'px-2.5 py-1 text-xs rounded-full border transition-colors duration-100',
            timeFilter === opt.value
              ? 'bg-[--color-brand] border-[--color-brand] text-white'
              : 'border-[--color-border] text-[--color-text-secondary] hover:border-[--color-brand] hover:text-[--color-brand]',
          ]"
          @click="emit('update:timeFilter', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Tags -->
    <section>
      <h3 class="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide mb-2">Tags</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in tags"
          :key="tag.id"
          :class="[
            'px-2.5 py-1 text-xs rounded-full border transition-colors duration-100',
            selectedTagIds.includes(tag.id)
              ? 'bg-[--color-brand] border-[--color-brand] text-white'
              : 'border-[--color-border] text-[--color-text-secondary] hover:border-[--color-brand] hover:text-[--color-brand]',
          ]"
          @click="emit('toggleTag', tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>
    </section>
  </aside>
</template>
