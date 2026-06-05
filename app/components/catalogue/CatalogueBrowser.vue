<script setup lang="ts">
import type { GameListItem } from '../../../server/db/queries/games'
import type { TagItem } from '../../../server/db/queries/tags'
import { useFilters } from '../../composables/useFilters'
import { useCatalogueView } from '../../composables/useCatalogueView'

const props = defineProps<{
  games: GameListItem[]
  tags: TagItem[]
}>()

const games = computed(() => props.games ?? [])
const tags = computed(() => props.tags ?? [])

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
    <!-- Toolbar: sticky glass chrome -->
    <div class="toolbar-sticky z-toolbar glass-chrome border-b">
      <div class="max-w-7xl mx-auto px-md py-2.5 flex items-center gap-2">

        <!-- Search: pill shape, glass fill -->
        <div class="flex-1 relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
            style="color: var(--color-text-muted)"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search games…"
            class="search-input w-full pl-9 pr-3 py-1.5 text-ui bg-white/50 border focus:outline-none focus:ring-2"
          />
        </div>

        <!-- Filter toggle (mobile) -->
        <button
          class="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-ui glass-chip motion-safe:transition-colors"
          :class="showFilters ? 'filter-active' : ''"
          style="color: var(--color-text-secondary)"
          @click="showFilters = !showFilters"
        >
          <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          <span v-if="hasActiveFilters" class="w-1.5 h-1.5 rounded-full" style="background: var(--color-brand)" />
        </button>

        <!-- View toggle: 38×38 buttons, 19px icons — separate buttons with gap -->
        <div class="flex gap-1 shrink-0">
          <button
            :class="['w-[38px] h-[38px] flex items-center justify-center motion-safe:transition-colors view-toggle-btn', view === 'grid' ? 'view-active' : 'glass-toggle']"
            title="Grid view"
            @click="setView('grid')"
          >
            <svg class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            :class="['w-[38px] h-[38px] flex items-center justify-center motion-safe:transition-colors view-toggle-btn', view === 'list' ? 'view-active' : 'glass-toggle']"
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

    <!-- Mobile filter drawer: fixed below sticky toolbar so it's in view regardless of scroll position -->
    <div
      v-if="showFilters"
      class="lg:hidden glass-chrome border-b px-md py-md filter-drawer"
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
            <p class="text-ui" style="color: var(--color-text-secondary)">
              <span class="font-medium" style="color: var(--color-text-primary)">{{ totalVisible }}</span>
              {{ totalVisible === 1 ? 'game' : 'games' }}
            </p>
          </div>

          <!-- Empty state -->
          <div v-if="totalVisible === 0" class="py-16 text-center">
            <p class="text-ui" style="color: var(--color-text-secondary)">No games match your filters.</p>
            <button
              class="mt-3 text-ui hover:underline"
              style="color: var(--color-brand)"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>

          <template v-else>
            <!-- Featured -->
            <section v-if="featured.length > 0" class="mb-xl">
              <h2 class="flex items-center gap-1.5 text-section-label font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-secondary)">
                <svg class="w-[13px] h-[13px] shrink-0" style="color: var(--color-brand)" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9z"/>
                </svg>
                Featured
              </h2>
              <template v-if="view === 'grid'">
                <!-- Mobile + tablet: compact carousel strip -->
                <CatalogueFeaturedStrip :games="featured" class="lg:hidden" />
                <!-- lg+ : full glass cards in the responsive grid -->
                <div class="hidden lg:grid lg:grid-cols-3 gap-3">
                  <NuxtLink
                    v-for="(game, i) in featured"
                    :key="game.id"
                    :to="`/games/${game.id}`"
                    class="block focus:outline-none focus-visible:ring-2 card-link"
                  >
                    <CatalogueGameCard :game="game" :eager="i < 3" />
                  </NuxtLink>
                </div>
              </template>
              <div v-else class="list-container overflow-hidden">
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
                class="text-section-label font-semibold uppercase tracking-wider mb-3"
                style="color: var(--color-text-secondary)"
              >
                All games
              </h2>
              <div
                v-if="view === 'grid'"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <NuxtLink
                  v-for="(game, i) in nonFeatured"
                  :key="game.id"
                  :to="`/games/${game.id}`"
                  class="block focus:outline-none focus-visible:ring-2 card-link"
                >
                  <CatalogueGameCard :game="game" :eager="featured.length === 0 && i < 3" />
                </NuxtLink>
              </div>
              <div v-else class="list-container overflow-hidden">
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
  background: var(--glass-fill);
  border-color: var(--glass-stroke);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
}

/* Header scrolls with the page; toolbar is the first sticky element. */
.toolbar-sticky {
  position: sticky;
  top: 0;
}

.glass-chip {
  background: rgb(255 255 255 / 0.45);
  border: 1px solid var(--glass-stroke);
  border-radius: var(--radius-full);
  backdrop-filter: blur(var(--glass-blur-card));
}

.filter-active {
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.view-toggle-btn {
  border: 1px solid var(--glass-stroke);
  border-radius: var(--radius-md);
}

.view-active {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: var(--color-brand-foreground);
}

.glass-toggle {
  background: rgb(255 255 255 / 0.40);
  color: var(--color-text-secondary);
}

.search-input {
  border-color: var(--glass-stroke);
  border-radius: var(--radius-full);
}

.search-input:focus {
  border-color: var(--color-brand);
  --tw-ring-color: rgb(21 128 61 / 0.15);
}

.card-link {
  border-radius: var(--radius-xl);
  --tw-ring-color: var(--color-brand);
}

.list-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.sidebar-sticky-top {
  position: sticky;
  top: var(--toolbar-height);
}

.filter-drawer {
  position: fixed;
  top: var(--toolbar-height);
  left: 0;
  right: 0;
  z-index: var(--z-toolbar);
  max-height: calc(100dvh - var(--toolbar-height));
  overflow-y: auto;
}
</style>
