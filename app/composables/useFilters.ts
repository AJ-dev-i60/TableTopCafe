import { computed, ref } from 'vue'
import type { GameListItem } from '../../server/db/queries/games'

export type PlayerCountFilter = 1 | 2 | 3 | 4 | 5 | 6 | null
export type TimeFilter = 'any' | 'under30' | 'under60' | 'under90' | 'under120' | 'over120'

export function useFilters(games: Readonly<Ref<GameListItem[]>>) {
  const search = ref('')
  const playerCount = ref<PlayerCountFilter>(null)
  const timeFilter = ref<TimeFilter>('any')
  const selectedTagIds = ref<number[]>([])

  const filtered = computed(() => {
    let list = games.value

    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase()
      list = list.filter((g) => g.name.toLowerCase().includes(q))
    }

    if (playerCount.value !== null) {
      const p = playerCount.value
      list = list.filter((g) => g.playerMin <= p && g.playerMax >= p)
    }

    if (timeFilter.value !== 'any') {
      list = list.filter((g) => matchesTimeFilter(g.timeMin, timeFilter.value))
    }

    if (selectedTagIds.value.length > 0) {
      const ids = new Set(selectedTagIds.value)
      list = list.filter((g) => g.tags.some((t) => ids.has(t.id)))
    }

    return list
  })

  const featured = computed(() => filtered.value.filter((g) => g.featured))
  const nonFeatured = computed(() => filtered.value.filter((g) => !g.featured))

  function toggleTag(id: number) {
    const idx = selectedTagIds.value.indexOf(id)
    if (idx === -1) {
      selectedTagIds.value = [...selectedTagIds.value, id]
    } else {
      selectedTagIds.value = selectedTagIds.value.filter((x) => x !== id)
    }
  }

  function clearFilters() {
    search.value = ''
    playerCount.value = null
    timeFilter.value = 'any'
    selectedTagIds.value = []
  }

  const hasActiveFilters = computed(
    () =>
      search.value.trim() !== '' ||
      playerCount.value !== null ||
      timeFilter.value !== 'any' ||
      selectedTagIds.value.length > 0,
  )

  return {
    search,
    playerCount,
    timeFilter,
    selectedTagIds,
    filtered,
    featured,
    nonFeatured,
    toggleTag,
    clearFilters,
    hasActiveFilters,
  }
}

function matchesTimeFilter(timeMin: number, filter: TimeFilter): boolean {
  switch (filter) {
    case 'under30': return timeMin < 30
    case 'under60': return timeMin <= 60
    case 'under90': return timeMin <= 90
    case 'under120': return timeMin <= 120
    case 'over120': return timeMin > 120
    default: return true
  }
}
