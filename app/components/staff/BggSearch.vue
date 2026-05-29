<template>
  <div class="relative">
    <SharedInput
      v-model="query"
      type="text"
      placeholder="Search BoardGameGeek…"
      autocomplete="off"
      @focus="showDropdown = results.length > 0"
      @blur="onBlur"
    />

    <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
      <span class="text-[--color-text-muted] text-ui">⏳</span>
    </div>

    <ul
      v-if="showDropdown && results.length > 0"
      class="absolute z-[--z-toolbar] mt-1 w-full bg-[--color-surface] border border-[--color-border] rounded-[--radius-md] shadow-md max-h-64 overflow-y-auto"
    >
      <li
        v-for="result in results"
        :key="result.bggId"
        class="px-3 py-2 text-ui text-[--color-text-primary] hover:bg-[--color-surface-muted] cursor-pointer flex items-center justify-between gap-2"
        @mousedown.prevent="select(result)"
      >
        <span>{{ result.name }}</span>
        <span v-if="result.yearPublished" class="text-detail text-[--color-text-muted] shrink-0">
          {{ result.yearPublished }}
        </span>
      </li>
    </ul>

    <p v-if="error" class="mt-1 text-detail text-[--color-error]">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
export type BggResult = {
  bggId: number
  name: string
  yearPublished: number | null
}

const emit = defineEmits<{
  select: [result: BggResult]
}>()

const query = ref('')
const results = ref<BggResult[]>([])
const loading = ref(false)
const error = ref('')
const showDropdown = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(query, (val) => {
  error.value = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  if (val.trim().length < 2) {
    results.value = []
    showDropdown.value = false
    return
  }
  debounceTimer = setTimeout(() => search(val.trim()), 350)
})

async function search(q: string) {
  loading.value = true
  try {
    const data = await $fetch<BggResult[]>('/api/bgg/search', { query: { q } })
    results.value = data
    showDropdown.value = data.length > 0
  } catch {
    error.value = 'BGG search unavailable — searching local cache'
    results.value = []
    showDropdown.value = false
  } finally {
    loading.value = false
  }
}

function select(result: BggResult) {
  query.value = result.name
  showDropdown.value = false
  emit('select', result)
}

function onBlur() {
  // Small delay so mousedown on a list item fires first
  setTimeout(() => { showDropdown.value = false }, 150)
}
</script>
