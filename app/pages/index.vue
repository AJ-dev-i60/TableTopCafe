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
    <!-- Search bar + view toggle -->
    <div class="sticky top-[57px] z-10 bg-[--color-surface] border-b border-[--color-border]">
      <div class="max-w-7xl mx-auto px-md py-2.5 flex items-center gap-2">
        <!-- Search -->
        <div class="flex-1 relative">
          <svg
            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search games…"
            class="w-full pl-8 pr-3 py-1.5 text-sm bg-[--color-surface-elevated] border border-[--color-border] rounded-[--radius-md] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand]"
          />
        </div>

        <!-- Filter toggle (mobile) -->
        <button
          class="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-ui border border-[--color-border] rounded-[--radius-md] text-[--color-text-secondary] hover:border-[--color-brand] hover:text-[--color-brand] transition-colors"
          :class="{ 'border-[--color-brand] text-[--color-brand]': showFilters }"
          @click="showFilters = !showFilters"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          <span
            v-if="hasActiveFilters"
            class="w-1.5 h-1.5 rounded-full bg-[--color-brand]"
          />
        </button>

        <!-- View toggle -->
        <div class="flex border border-[--color-border] rounded-[--radius-md] overflow-hidden shrink-0">
          <button
            :class="['px-2.5 py-1.5', view === 'grid' ? 'bg-[--color-brand] text-[--color-brand-foreground]' : 'text-[--color-text-secondary] hover:bg-[--color-surface-elevated]']"
            title="Grid view"
            @click="setView('grid')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            :class="['px-2.5 py-1.5', view === 'list' ? 'bg-[--color-brand] text-[--color-brand-foreground]' : 'text-[--color-text-secondary] hover:bg-[--color-surface-elevated]']"
            title="List view"
            @click="setView('list')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile filter drawer -->
    <div
      v-if="showFilters"
      class="lg:hidden border-b border-[--color-border] bg-[--color-surface] px-md py-md"
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
          <div class="sticky top-[115px]">
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

          <!-- Count + status -->
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
                class="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                <NuxtLink
                  v-for="game in featured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] rounded-lg"
                >
                  <CatalogueGameCard :game="game" />
                </NuxtLink>
              </div>
              <div v-else class="rounded-[--radius-lg] border border-[--color-border] overflow-hidden">
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
                class="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-3"
              >
                All games
              </h2>
              <div
                v-if="view === 'grid'"
                class="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                <NuxtLink
                  v-for="game in nonFeatured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] rounded-lg"
                >
                  <CatalogueGameCard :game="game" />
                </NuxtLink>
              </div>
              <div v-else class="rounded-[--radius-lg] border border-[--color-border] overflow-hidden">
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
