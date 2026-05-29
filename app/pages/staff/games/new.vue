<template>
  <div class="max-w-2xl">
    <div class="flex items-center gap-2 mb-lg">
      <NuxtLink to="/staff" class="text-ui text-[--color-text-muted] hover:text-[--color-text-primary]">
        ← Games
      </NuxtLink>
      <span class="text-[--color-text-muted]">/</span>
      <h1 class="text-xl font-bold text-[--color-text-primary]">Add game</h1>
    </div>

    <div class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] p-6">
      <StaffGameForm
        :available-tags="tags ?? []"
        :featured-count="featuredCount?.count ?? 0"
        submit-label="Add game"
        @saved="onSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'staff', middleware: ['auth'] })

const [{ data: tags }, { data: featuredCount }] = await Promise.all([
  useFetch('/api/tags'),
  useFetch('/api/staff/games/featured-count'),
])

async function onSaved(gameId: number) {
  await navigateTo('/staff')
}
</script>
