<template>
  <div>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-1">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">Games</h1>
        <p class="text-meta mt-0.5" style="color: var(--color-text-muted)">{{ liveCount }} live · {{ deletedCount }} deleted</p>
      </div>
      <NuxtLink
        to="/staff/games/new"
        class="add-btn inline-flex items-center gap-1.5 text-ui font-medium px-4 py-2 transition-colors shrink-0"
        style="background: var(--color-brand); color: var(--color-brand-foreground)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add game
      </NuxtLink>
    </div>

    <!-- Segmented filter control -->
    <div class="flex mb-md mt-md">
      <div class="inline-flex overflow-hidden segmented-control">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          class="px-4 py-1.5 text-ui transition-colors"
          :class="filter === opt.value ? 'seg-active' : 'seg-idle'"
          @click="filter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="text-ui" style="color: var(--color-text-muted)">Loading…</div>

    <div v-else-if="!filteredGames.length" class="text-ui" style="color: var(--color-text-muted)">
      {{ filter === 'deleted' ? 'No deleted games.' : filter === 'live' ? 'No live games yet. Add the first one.' : 'No games yet.' }}
    </div>

    <!-- Table -->
    <div v-else class="table-container overflow-hidden" style="background: var(--color-surface)">
      <table class="w-full">
        <thead>
          <tr class="table-header border-b" style="border-color: var(--color-border)">
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-md py-2.5" style="color: var(--color-text-secondary)">Game</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-3 py-2.5 hidden sm:table-cell" style="color: var(--color-text-secondary)">Players</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-3 py-2.5 hidden sm:table-cell" style="color: var(--color-text-secondary)">Play time</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-3 py-2.5" style="color: var(--color-text-secondary)">Status</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-right px-md py-2.5" style="color: var(--color-text-secondary)">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y" style="border-color: var(--color-border)">
          <tr
            v-for="game in filteredGames"
            :key="game.id"
            class="table-row transition-colors"
          >
            <!-- Game: thumb + name + featured pill -->
            <td class="px-md py-3">
              <div class="flex items-center gap-3">
                <div class="shrink-0 w-10 h-10 overflow-hidden" style="border-radius: var(--radius-sm)">
                  <img
                    v-if="game.photoHash"
                    :src="`/api/photos/${game.photoHash}/thumb.jpg`"
                    :alt="game.name"
                    loading="lazy"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="thumb-fallback w-full h-full flex items-center justify-center">
                    <span class="text-sm font-bold text-white/60 leading-none select-none" aria-hidden="true">
                      {{ game.name.charAt(0) }}
                    </span>
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-card-title font-medium truncate" style="color: var(--color-text-primary)">{{ game.name }}</p>
                  <SharedFeaturedBadge v-if="game.featured && !game.deletedAt" class="mt-0.5" />
                </div>
              </div>
            </td>

            <td class="px-3 py-3 text-ui hidden sm:table-cell" style="white-space: nowrap; color: var(--color-text-secondary)">
              {{ game.playerMin }}–{{ game.playerMax }}
            </td>

            <td class="px-3 py-3 text-ui hidden sm:table-cell" style="white-space: nowrap; color: var(--color-text-secondary)">
              {{ game.timeMin }}–{{ game.timeMax }} min
            </td>

            <!-- Status pill -->
            <td class="px-3 py-3">
              <span v-if="game.deletedAt" class="pill-deleted inline-block px-2 py-0.5 text-tag">Deleted</span>
              <span v-else-if="game.featured" class="pill-featured inline-block px-2 py-0.5 text-tag">Featured</span>
              <span v-else class="pill-live inline-block px-2 py-0.5 text-tag">Live</span>
            </td>

            <!-- Actions -->
            <td class="px-md py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <template v-if="!game.deletedAt">
                  <NuxtLink
                    :to="`/staff/games/${game.id}/edit`"
                    class="text-ui font-medium hover:underline"
                    style="color: var(--color-brand)"
                  >
                    Edit
                  </NuxtLink>
                  <SharedButton variant="danger" @click="deleteGame(game.id, game.name)">
                    Delete
                  </SharedButton>
                </template>
                <template v-else>
                  <SharedButton variant="secondary" @click="restoreGame(game.id, game.name)">
                    Restore
                  </SharedButton>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'staff', middleware: ['auth'] })

const { data: games, pending, refresh } = await useFetch('/api/staff/games')

type FilterValue = 'live' | 'deleted' | 'all'
const filter = ref<FilterValue>('live')

const filterOptions: { label: string; value: FilterValue }[] = [
  { label: 'Live', value: 'live' },
  { label: 'Deleted', value: 'deleted' },
  { label: 'All', value: 'all' },
]

const liveCount = computed(() => games.value?.filter((g) => !g.deletedAt).length ?? 0)
const deletedCount = computed(() => games.value?.filter((g) => !!g.deletedAt).length ?? 0)

const filteredGames = computed(() => {
  if (!games.value) return []
  if (filter.value === 'live') return games.value.filter((g) => !g.deletedAt)
  if (filter.value === 'deleted') return games.value.filter((g) => !!g.deletedAt)
  return games.value
})

async function deleteGame(id: number, name: string) {
  if (!confirm(`Delete "${name}"? It will be hidden from the catalogue.`)) return
  await $fetch(`/api/staff/games/${id}`, { method: 'DELETE' })
  await refresh()
}

async function restoreGame(id: number, name: string) {
  if (!confirm(`Restore "${name}"? It will reappear in the catalogue.`)) return
  await $fetch(`/api/staff/games/${id}/restore`, { method: 'POST' })
  await refresh()
}
</script>

<style scoped>
.add-btn {
  border-radius: var(--radius-md);
}
.add-btn:hover {
  background: var(--color-brand-hover) !important;
}

.segmented-control {
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.seg-active {
  background: var(--color-brand);
  color: var(--color-brand-foreground);
  font-weight: 500;
}

.seg-idle {
  background: var(--color-surface);
  color: var(--color-text-secondary);
}
.seg-idle:hover {
  background: var(--color-surface-elevated);
}

.table-container {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.table-header {
  background: var(--color-surface-elevated);
}

.table-row:hover {
  background: var(--color-surface-elevated);
}

.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.pill-live {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border-radius: var(--radius-full);
}

.pill-deleted {
  background: var(--color-error-soft);
  color: var(--color-error);
  border-radius: var(--radius-full);
}

.pill-featured {
  background: rgb(21 128 61 / 0.12);
  color: var(--color-brand);
  border-radius: var(--radius-full);
}
</style>
