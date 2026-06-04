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
      <h2 class="text-ui font-semibold" style="color: var(--color-text-primary)">Filters</h2>
      <button
        v-if="hasActiveFilters"
        class="text-meta hover:underline"
        style="color: var(--color-brand)"
        @click="emit('clearFilters')"
      >
        Clear all
      </button>
    </div>

    <!-- Player count -->
    <section>
      <h3 class="text-section-label font-medium uppercase tracking-wide mb-2" style="color: var(--color-text-secondary)">Players</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in PLAYER_OPTIONS"
          :key="opt.label"
          class="chip px-2.5 py-1 text-tag motion-safe:transition-colors motion-safe:duration-fast"
          :class="playerCount === opt.value ? 'chip-active' : 'chip-idle'"
          @click="emit('update:playerCount', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Play time -->
    <section>
      <h3 class="text-section-label font-medium uppercase tracking-wide mb-2" style="color: var(--color-text-secondary)">Play time</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in TIME_OPTIONS"
          :key="opt.value"
          class="chip px-2.5 py-1 text-tag motion-safe:transition-colors motion-safe:duration-fast"
          :class="timeFilter === opt.value ? 'chip-active' : 'chip-idle'"
          @click="emit('update:timeFilter', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Tags -->
    <section>
      <h3 class="text-section-label font-medium uppercase tracking-wide mb-2" style="color: var(--color-text-secondary)">Tags</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in tags"
          :key="tag.id"
          class="chip px-2.5 py-1 text-tag motion-safe:transition-colors motion-safe:duration-fast"
          :class="selectedTagIds.includes(tag.id) ? 'chip-active' : 'chip-idle'"
          @click="emit('toggleTag', tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.chip {
  border-radius: var(--radius-full);
  border-width: 1px;
  border-style: solid;
}

.chip-active {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: var(--color-brand-foreground);
}

.chip-idle {
  background: rgb(255 255 255 / 0.55);
  border-color: var(--glass-stroke);
  color: var(--color-text-secondary);
}

.chip-idle:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
</style>
