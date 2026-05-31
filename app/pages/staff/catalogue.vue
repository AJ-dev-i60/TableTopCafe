<script setup lang="ts">
import type { GameListItem } from '../../../server/db/queries/games'
import type { TagItem } from '../../../server/db/queries/tags'

definePageMeta({ layout: 'staff', middleware: ['auth'] })

// Distinct useAsyncData keys so this preview's payload doesn't collide with the
// public catalogue page's SSR cache. Uses the same public /api/games (live games).
const { data: allGames } = await useAsyncData<GameListItem[]>('staff-catalogue-games', () => $fetch('/api/games'))
const { data: allTags } = await useAsyncData<TagItem[]>('staff-catalogue-tags', () => $fetch('/api/tags'))
</script>

<template>
  <CatalogueBrowser :games="allGames ?? []" :tags="allTags ?? []" />
</template>
