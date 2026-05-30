<template>
  <div class="max-w-5xl">
    <div class="flex items-center gap-2 mb-lg">
      <NuxtLink to="/staff" class="crumb-link text-ui">
        ← Games
      </NuxtLink>
      <span style="color: var(--color-text-muted)">/</span>
      <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">Add game</h1>
    </div>

    <div class="form-shell border p-6">
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
