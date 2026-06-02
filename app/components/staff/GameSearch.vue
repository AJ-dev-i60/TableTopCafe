<template>
  <div class="relative">
    <SharedInput
      v-model="query"
      type="text"
      placeholder="Search board games…"
      autocomplete="off"
      @focus="showDropdown = results.length > 0"
      @blur="onBlur"
    />

    <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
      <span class="text-ui" style="color: var(--color-text-muted)">⏳</span>
    </div>

    <ul
      v-if="showDropdown && results.length > 0"
      class="game-search-dropdown absolute z-toolbar mt-1 w-full border shadow-md max-h-64 overflow-y-auto"
    >
      <li
        v-for="result in results"
        :key="result.name"
        class="game-search-option px-3 py-2 text-ui cursor-pointer flex items-center justify-between gap-2"
        @mousedown.prevent="select(result)"
      >
        <span>{{ result.name }}</span>
        <span v-if="result.yearPublished" class="text-meta shrink-0" style="color: var(--color-text-muted)">
          {{ result.yearPublished }}
        </span>
      </li>
    </ul>

    <p v-if="error" class="mt-1 text-meta" style="color: var(--color-error)">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
export type GameSearchResult = {
  name: string
  bggId: number | null
  yearPublished: number | null
}

const emit = defineEmits<{
  select: [result: GameSearchResult]
}>()

const query = ref('')
const results = ref<GameSearchResult[]>([])
const loading = ref(false)
const error = ref('')
const showDropdown = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
// Selecting writes the name back into the box; skip the search that would
// otherwise retrigger and reopen the dropdown.
let suppressNextSearch = false

watch(query, (val) => {
  if (suppressNextSearch) {
    suppressNextSearch = false
    return
  }
  error.value = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  if (val.trim().length < 1) {
    results.value = []
    showDropdown.value = false
    return
  }
  // Local in-memory search — short debounce just to coalesce keystrokes.
  debounceTimer = setTimeout(() => search(val.trim()), 150)
})

async function search(q: string) {
  loading.value = true
  try {
    const data = await $fetch<GameSearchResult[]>('/api/game-names/search', { query: { q } })
    results.value = data
    showDropdown.value = data.length > 0
  } catch {
    error.value = 'Search failed. Try again.'
    results.value = []
    showDropdown.value = false
  } finally {
    loading.value = false
  }
}

function select(result: GameSearchResult) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (result.name !== query.value) suppressNextSearch = true
  query.value = result.name
  results.value = []
  showDropdown.value = false
  emit('select', result)
}

function onBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}
</script>

<style scoped>
.game-search-dropdown {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-md);
}

.game-search-option {
  color: var(--color-text-primary);
}
.game-search-option:hover {
  background: var(--color-surface-elevated);
}
</style>
