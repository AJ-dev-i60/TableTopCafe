<template>
  <div>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-1">
      <div>
        <h1 class="text-2xl font-bold text-[--color-text-primary]">Games</h1>
        <p class="text-meta text-[--color-text-muted] mt-0.5">{{ liveCount }} live · {{ deletedCount }} deleted</p>
      </div>
      <NuxtLink
        to="/staff/games/new"
        class="inline-flex items-center gap-1.5 bg-[--color-brand] hover:bg-[--color-brand-hover] text-[--color-brand-foreground] text-ui font-medium rounded-[--radius-md] px-4 py-2 transition-colors shrink-0"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add game
      </NuxtLink>
    </div>

    <!-- Segmented filter control -->
    <div class="flex mb-md mt-md">
      <div class="inline-flex border border-[--color-border-strong] rounded-[--radius-md] overflow-hidden">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          class="px-4 py-1.5 text-ui transition-colors"
          :class="filter === opt.value
            ? 'bg-[--color-brand] text-[--color-brand-foreground] font-medium'
            : 'bg-[--color-surface] text-[--color-text-secondary] hover:bg-[--color-surface-elevated]'"
          @click="filter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="text-ui text-[--color-text-muted]">Loading…</div>

    <div v-else-if="!filteredGames.length" class="text-ui text-[--color-text-muted]">
      {{ filter === 'deleted' ? 'No deleted games.' : filter === 'live' ? 'No live games yet. Add the first one.' : 'No games yet.' }}
    </div>

    <!-- Table -->
    <div v-else class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-[--color-surface-elevated] border-b border-[--color-border]">
            <th class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider text-left px-md py-2.5">Game</th>
            <th class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider text-left px-3 py-2.5 hidden sm:table-cell">Players</th>
            <th class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider text-left px-3 py-2.5 hidden sm:table-cell">Play time</th>
            <th class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider text-left px-3 py-2.5">Status</th>
            <th class="text-section-label font-semibold text-[--color-text-secondary] uppercase tracking-wider text-right px-md py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[--color-border]">
          <tr
            v-for="game in filteredGames"
            :key="game.id"
            class="hover:bg-[--color-surface-elevated] transition-colors"
          >
            <!-- Game: thumb + name + featured pill -->
            <td class="px-md py-3">
              <div class="flex items-center gap-3">
                <div class="shrink-0 w-10 h-10 rounded-[--radius-sm] overflow-hidden">
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
                  <p class="text-card-title font-medium text-[--color-text-primary] truncate">{{ game.name }}</p>
                  <SharedFeaturedBadge v-if="game.featured && !game.deletedAt" class="mt-0.5" />
                </div>
              </div>
            </td>

            <!-- Players -->
            <td class="px-3 py-3 text-ui text-[--color-text-secondary] whitespace-nowrap hidden sm:table-cell">
              {{ game.playerMin }}–{{ game.playerMax }}
            </td>

            <!-- Play time -->
            <td class="px-3 py-3 text-ui text-[--color-text-secondary] whitespace-nowrap hidden sm:table-cell">
              {{ game.timeMin }}–{{ game.timeMax }} min
            </td>

            <!-- Status pill -->
            <td class="px-3 py-3">
              <span v-if="game.deletedAt" class="pill-deleted inline-block px-2 py-0.5 text-tag rounded-[--radius-full]">Deleted</span>
              <span v-else-if="game.featured" class="pill-featured inline-block px-2 py-0.5 text-tag rounded-[--radius-full]">Featured</span>
              <span v-else class="pill-live inline-block px-2 py-0.5 text-tag rounded-[--radius-full]">Live</span>
            </td>

            <!-- Actions -->
            <td class="px-md py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <template v-if="!game.deletedAt">
                  <NuxtLink
                    :to="`/staff/games/${game.id}/edit`"
                    class="text-ui text-[--color-brand] hover:underline font-medium"
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
.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.pill-live {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
}

.pill-deleted {
  background: var(--color-error-soft);
  color: var(--color-error);
}

.pill-featured {
  background: rgb(21 128 61 / 0.12);
  color: var(--color-brand);
}
</style>
