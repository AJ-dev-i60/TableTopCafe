<template>
  <div class="max-w-5xl">
    <div class="flex items-center gap-2 mb-lg">
      <NuxtLink to="/staff" class="crumb-link text-ui">
        ← Games
      </NuxtLink>
      <span style="color: var(--color-text-muted)">/</span>
      <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">Edit game</h1>
    </div>

    <div v-if="pending" class="text-ui" style="color: var(--color-text-muted)">Loading…</div>
    <div v-else-if="!game" class="text-sm" style="color: var(--color-error)">Game not found.</div>
    <div v-else class="form-shell border p-4 sm:p-6">
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
          bggId: game.bggId ?? null,
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

<style scoped>
.crumb-link {
  color: var(--color-text-muted);
}
.crumb-link:hover {
  color: var(--color-text-primary);
}

.form-shell {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
}
</style>
