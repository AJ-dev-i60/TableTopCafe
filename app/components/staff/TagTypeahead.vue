<template>
  <div>
    <!-- Selected tags -->
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2 mb-2">
      <span
        v-for="tag in modelValue"
        :key="tag.id ?? tag.name"
        class="inline-flex items-center gap-1 bg-[--color-surface-elevated] border border-[--color-border] text-[--color-text-secondary] text-tag rounded-[--radius-full] px-3 py-1"
      >
        {{ tag.name }}
        <button
          type="button"
          class="text-[--color-text-muted] hover:text-[--color-error] leading-none"
          @click="remove(tag)"
        >
          ×
        </button>
      </span>
    </div>

    <!-- Input -->
    <div class="relative">
      <SharedInput
        v-model="query"
        type="text"
        placeholder="Search or create tags…"
        @focus="open = true"
        @blur="onBlur"
        @keydown.enter.prevent="selectFirst"
        @keydown.escape="open = false"
      />

      <!-- Dropdown -->
      <ul
        v-if="open && (filtered.length > 0 || canCreate)"
        class="absolute z-toolbar left-0 right-0 mt-1 bg-[--color-surface] border border-[--color-border] rounded-[--radius-md] shadow-[--shadow-md] max-h-48 overflow-y-auto"
      >
        <li
          v-for="tag in filtered"
          :key="tag.id"
          class="px-3 py-2 text-ui text-[--color-text-primary] cursor-pointer hover:bg-[--color-surface-elevated]"
          @mousedown.prevent="select(tag)"
        >
          {{ tag.name }}
        </li>
        <li
          v-if="canCreate"
          class="px-3 py-2 text-ui text-[--color-brand] cursor-pointer hover:bg-[--color-surface-elevated] border-t border-[--color-border]"
          @mousedown.prevent="createNew"
        >
          Create "{{ query.trim() }}"
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
export type TagOption = { id?: number; name: string }

const props = defineProps<{
  modelValue: TagOption[]
  availableTags: TagOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tags: TagOption[]]
}>()

const query = ref('')
const open = ref(false)

const selectedNames = computed(() => new Set(props.modelValue.map((t) => t.name.toLowerCase())))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.availableTags.filter(
    (t) => t.name.toLowerCase().includes(q) && !selectedNames.value.has(t.name.toLowerCase()),
  )
})

const canCreate = computed(() => {
  const q = query.value.trim()
  if (!q) return false
  const exact = props.availableTags.some((t) => t.name.toLowerCase() === q.toLowerCase())
  return !exact && !selectedNames.value.has(q.toLowerCase())
})

function select(tag: TagOption) {
  emit('update:modelValue', [...props.modelValue, tag])
  query.value = ''
  open.value = false
}

function createNew() {
  const name = query.value.trim()
  if (!name) return
  emit('update:modelValue', [...props.modelValue, { name }])
  query.value = ''
  open.value = false
}

function remove(tag: TagOption) {
  emit('update:modelValue', props.modelValue.filter((t) => t.name !== tag.name))
}

function selectFirst() {
  if (filtered.value.length > 0) {
    select(filtered.value[0]!)
  } else if (canCreate.value) {
    createNew()
  }
}

function onBlur() {
  setTimeout(() => { open.value = false }, 150)
}
</script>
