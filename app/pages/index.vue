<script setup lang="ts">
import type { GameListItem } from '../../server/db/queries/games'
import type { TagItem } from '../../server/db/queries/tags'

const { data: allGames } = await useAsyncData<GameListItem[]>('games', () => $fetch('/api/games'))
const { data: allTags } = await useAsyncData<TagItem[]>('tags', () => $fetch('/api/tags'))
</script>

<template>
  <CatalogueBrowser :games="allGames ?? []" :tags="allTags ?? []" />
</template>
