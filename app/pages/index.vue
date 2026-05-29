<script setup lang="ts">
import type { GameListItem } from '../../server/db/queries/games'
import type { TagItem } from '../../server/db/queries/tags'
import { useFilters } from '../composables/useFilters'
import { useCatalogueView } from '../composables/useCatalogueView'

const { data: allGames } = await useAsyncData<GameListItem[]>('games', () => $fetch('/api/games'))
const { data: allTags } = await useAsyncData<TagItem[]>('tags', () => $fetch('/api/tags'))

const games = computed(() => allGames.value ?? [])
const tags = computed(() => allTags.value ?? [])

const {
  search,
  playerCount,
  timeFilter,
  selectedTagIds,
  featured,
  nonFeatured,
  toggleTag,
  clearFilters,
  hasActiveFilters,
} = useFilters(games)

const { view, setView } = useCatalogueView()

const showFilters = ref(false)

const totalVisible = computed(() => featured.value.length + nonFeatured.value.length)
</script>

<template>
  <div>
    <!-- Toolbar: sticky glass chrome, same treatment as header -->
    <div class="sticky top-[--header-height] z-toolbar glass-chrome bg-[--glass-fill] border-b border-[--glass-stroke]">
      <div class="max-w-7xl mx-auto px-md py-2.5 flex items-center gap-2">

        <!-- Search: pill shape, glass fill -->
        <div class="flex-1 relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[--color-text-muted]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search games…"
            class="w-full pl-9 pr-3 py-1.5 text-ui bg-white/50 border border-[--glass-stroke] rounded-[--radius-full] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand] focus:ring-2 focus:ring-[--color-brand]/15"
          />
        </div>

        <!-- Filter toggle (mobile) -->
        <button
          class="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-ui glass-chip rounded-[--radius-full] text-[--color-text-secondary] hover:border-[--color-brand] hover:text-[--color-brand] motion-safe:transition-colors"
          :class="{ 'border-[--color-brand] text-[--color-brand]': showFilters }"
          @click="showFilters = !showFilters"
        >
          <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          <span
            v-if="hasActiveFilters"
            class="w-1.5 h-1.5 rounded-full bg-[--color-brand]"
          />
        </button>

        <!-- View toggle: 38×38 buttons, 19px icons -->
        <div class="flex border border-[--glass-stroke] rounded-[--radius-md] overflow-hidden shrink-0">
          <button
            :class="['w-[38px] h-[38px] flex items-center justify-center motion-safe:transition-colors', view === 'grid' ? 'bg-[--color-brand] text-[--color-brand-foreground]' : 'glass-toggle text-[--color-text-secondary] hover:bg-white/60']"
            title="Grid view"
            @click="setView('grid')"
          >
            <svg class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            :class="['w-[38px] h-[38px] flex items-center justify-center motion-safe:transition-colors', view === 'list' ? 'bg-[--color-brand] text-[--color-brand-foreground]' : 'glass-toggle text-[--color-text-secondary] hover:bg-white/60']"
            title="List view"
            @click="setView('list')"
          >
            <svg class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile filter drawer: glass continuation of toolbar -->
    <div
      v-if="showFilters"
      class="lg:hidden glass-chrome bg-[--glass-fill] border-b border-[--glass-stroke] px-md py-md"
    >
      <CatalogueFilters
        :tags="tags"
        :selected-tag-ids="selectedTagIds"
        :player-count="playerCount"
        :time-filter="timeFilter"
        :has-active-filters="hasActiveFilters"
        @update:player-count="playerCount = $event"
        @update:time-filter="timeFilter = $event"
        @toggle-tag="toggleTag"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Main content -->
    <div class="max-w-7xl mx-auto px-md py-lg">
      <div class="flex gap-xl">

        <!-- Desktop filter sidebar -->
        <aside class="hidden lg:block w-52 shrink-0">
          <div class="sticky sidebar-sticky-top">
            <CatalogueFilters
              :tags="tags"
              :selected-tag-ids="selectedTagIds"
              :player-count="playerCount"
              :time-filter="timeFilter"
              :has-active-filters="hasActiveFilters"
              @update:player-count="playerCount = $event"
              @update:time-filter="timeFilter = $event"
              @toggle-tag="toggleTag"
              @clear-filters="clearFilters"
            />
          </div>
        </aside>

        <!-- Game list / grid -->
        <div class="flex-1 min-w-0">

          <!-- Count -->
          <div class="flex items-center justify-between mb-md">
            <p class="text-ui text-[--color-text-secondary]">
              <span class="font-medium text-[--color-text-primary]">{{ totalVisible }}</span>
              {{ totalVisible === 1 ? 'game' : 'games' }}
            </p>
          </div>

          <!-- Empty state -->
          <div v-if="totalVisible === 0" class="py-16 text-center">
            <p class="text-ui text-[--color-text-secondary]">No games match your filters.</p>
            <button
              class="mt-3 text-ui text-[--color-brand] hover:underline"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>

          <template v-else>
            <!-- Featured -->
            <section v-if="featured.length > 0" class="mb-xl">
              <h2 class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-3">Featured</h2>
              <div
                v-if="view === 'grid'"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <NuxtLink
                  v-for="game in featured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] rounded-[--radius-xl]"
                >
                  <CatalogueGameCard :game="game" />
                </NuxtLink>
              </div>
              <div v-else class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] overflow-hidden">
                <NuxtLink
                  v-for="game in featured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none"
                >
                  <CatalogueGameListItem :game="game" />
                </NuxtLink>
              </div>
            </section>

            <!-- All games -->
            <section>
              <h2
                v-if="featured.length > 0"
                class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-3"
              >
                All games
              </h2>
              <div
                v-if="view === 'grid'"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <NuxtLink
                  v-for="game in nonFeatured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] rounded-[--radius-xl]"
                >
                  <CatalogueGameCard :game="game" />
                </NuxtLink>
              </div>
              <div v-else class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] overflow-hidden">
                <NuxtLink
                  v-for="game in nonFeatured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none"
                >
                  <CatalogueGameListItem :game="game" />
                </NuxtLink>
              </div>
            </section>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-chrome {
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
}

.glass-chip {
  background: rgb(255 255 255 / 0.45);
  border: 1px solid var(--glass-stroke);
  backdrop-filter: blur(var(--glass-blur-card));
}

.glass-toggle {
  background: rgb(255 255 255 / 0.35);
}

.sidebar-sticky-top {
  top: calc(var(--header-height) + var(--toolbar-height));
}
</style>
