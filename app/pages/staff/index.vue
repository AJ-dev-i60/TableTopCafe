<template>
  <div>
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-2xl font-bold text-[--color-text-primary]">Games</h1>
      <NuxtLink
        to="/staff/games/new"
        class="bg-[--color-brand] hover:bg-[--color-brand-hover] text-white text-ui font-medium rounded-[--radius-md] px-4 py-2 transition-colors"
      >
        Add game
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-sm text-[--color-text-muted]">Loading…</div>

    <div v-else-if="!games?.length" class="text-sm text-[--color-text-muted]">
      No games yet. Add the first one.
    </div>

    <div v-else class="bg-white rounded-[--radius-lg] border border-[--color-border] divide-y divide-[--color-border]">
      <div
        v-for="game in games"
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
          <NuxtLink
            v-if="!game.deletedAt"
            :to="`/staff/games/${game.id}/edit`"
            class="text-ui text-[--color-brand] hover:underline"
          >
            Edit
          </NuxtLink>
          <button
            v-if="!game.deletedAt"
            class="text-ui text-[--color-error] hover:underline"
            @click="deleteGame(game.id, game.name)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'staff', middleware: ['auth'] })

const { data: games, pending, refresh } = await useFetch('/api/staff/games')

async function deleteGame(id: number, name: string) {
  if (!confirm(`Delete "${name}"? It will be hidden from the catalogue.`)) return
  await $fetch(`/api/staff/games/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
