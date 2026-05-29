<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-bold text-[--color-text-primary]">Games</h1>
      <NuxtLink
        to="/staff/games/new"
        class="bg-[--color-brand] hover:bg-[--color-brand-hover] text-[--color-brand-foreground] text-ui font-medium rounded-[--radius-md] px-4 py-2 transition-colors"
      >
        Add game
      </NuxtLink>
    </div>
    <p class="text-meta text-[--color-text-muted] mb-lg">{{ liveCount }} live · {{ deletedCount }} deleted</p>

    <!-- Filter -->
    <div class="flex gap-1 mb-md">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        class="text-ui px-3 py-1 rounded-[--radius-md] transition-colors"
        :class="filter === opt.value
          ? 'bg-[--color-brand] text-[--color-brand-foreground] font-medium'
          : 'text-[--color-text-secondary] hover:bg-[--color-surface-elevated]'"
        @click="filter = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="pending" class="text-sm text-[--color-text-muted]">Loading…</div>

    <div v-else-if="!filteredGames.length" class="text-sm text-[--color-text-muted]">
      {{ filter === 'deleted' ? 'No deleted games.' : filter === 'live' ? 'No live games yet. Add the first one.' : 'No games yet.' }}
    </div>

    <div v-else class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] divide-y divide-[--color-border]">
      <div
        v-for="game in filteredGames"
        :key="game.id"
        class="flex items-center justify-between px-md py-3"
        :class="{ 'opacity-50': game.deletedAt }"
      >
        <div class="min-w-0">
          <p class="text-card-title font-medium text-[--color-text-primary] truncate">
            {{ game.name }}
            <span v-if="game.deletedAt" class="ml-2 text-xs text-[--color-text-muted] font-normal">(deleted)</span>
            <span v-if="game.featured" class="ml-2 text-xs text-[--color-brand] font-normal">★ Featured</span>
          </p>
          <p class="text-meta text-[--color-text-muted]">
            {{ game.playerMin }}–{{ game.playerMax }} players · {{ game.timeMin }}–{{ game.timeMax }} min
          </p>
        </div>
        <div class="flex items-center gap-2 ml-4 shrink-0">
          <template v-if="!game.deletedAt">
            <NuxtLink
              :to="`/staff/games/${game.id}/edit`"
              class="text-ui text-[--color-brand] hover:underline"
            >
              Edit
            </NuxtLink>
            <SharedButton variant="danger" @click="deleteGame(game.id, game.name)">
              Delete
            </SharedButton>
          </template>
          <template v-else>
            <SharedButton @click="restoreGame(game.id, game.name)">
              Restore
            </SharedButton>
          </template>
        </div>
      </div>
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
