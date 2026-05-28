<template>
  <div class="max-w-2xl">
    <div class="flex items-center gap-2 mb-6">
      <NuxtLink to="/staff" class="text-sm text-[--color-text-muted] hover:text-[--color-text-primary]">
        ← Games
      </NuxtLink>
      <span class="text-[--color-text-muted]">/</span>
      <h1 class="text-xl font-bold text-[--color-text-primary]">Add game</h1>
    </div>

    <div class="bg-white rounded-[--radius-lg] border border-[--color-border] p-6">
      <StaffGameForm
        :available-tags="tags ?? []"
        submit-label="Add game"
        @saved="onSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'staff', middleware: ['auth'] })

const { data: tags } = await useFetch('/api/tags')

async function onSaved(gameId: number) {
  await navigateTo('/staff')
}
</script>
