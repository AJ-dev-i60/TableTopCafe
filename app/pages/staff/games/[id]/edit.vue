<template>
  <div class="max-w-2xl">
    <div class="flex items-center gap-2 mb-lg">
      <NuxtLink to="/staff" class="text-ui text-[--color-text-muted] hover:text-[--color-text-primary]">
        ← Games
      </NuxtLink>
      <span class="text-[--color-text-muted]">/</span>
      <h1 class="text-xl font-bold text-[--color-text-primary]">Edit game</h1>
    </div>

    <div v-if="pending" class="text-ui text-[--color-text-muted]">Loading…</div>
    <div v-else-if="!game" class="text-sm text-[--color-error]">Game not found.</div>
    <div v-else class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] p-6">
      <StaffGameForm
        :initial="{
          id: game.id,
          name: game.name,
          description: game.description ?? null,
          playerMin: game.playerMin,
          playerMax: game.playerMax,
          timeMin: game.timeMin,
          timeMax: game.timeMax,
          featured: game.featured,
          featuredNote: game.featuredNote ?? null,
          tagIds: game.tags.map(t => t.id),
          photoHashes: game.photos.map(p => p.contentHash),
        }"
        :available-tags="tags ?? []"
        :featured-count="featuredCount?.count ?? 0"
        submit-label="Save changes"
        @saved="onSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'staff', middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string

const [{ data: game, pending }, { data: tags }, { data: featuredCount }] = await Promise.all([
  useFetch(`/api/games/${id}`),
  useFetch('/api/tags'),
  useFetch('/api/staff/games/featured-count'),
])

async function onSaved(_gameId: number) {
  await navigateTo('/staff')
}
</script>
