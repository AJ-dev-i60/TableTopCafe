<template>
  <div>
    <!-- Selected tags -->
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2 mb-2">
      <span
        v-for="tag in modelValue"
        :key="tag.id ?? tag.name"
        class="selected-tag inline-flex items-center gap-1 text-tag px-3 py-1 border"
      >
        {{ tag.name }}
        <button
          type="button"
          class="remove-btn leading-none"
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
        @input="open = true"
        @blur="onBlur"
        @keydown.enter.prevent="selectFirst"
        @keydown.escape="open = false"
      />

      <!-- Dropdown -->
      <ul
        v-if="open && (filtered.length > 0 || canCreate)"
        class="tag-dropdown absolute z-toolbar left-0 right-0 mt-1 border max-h-48 overflow-y-auto"
      >
        <li
          v-for="tag in filtered"
          :key="tag.id"
          class="tag-option px-3 py-2 text-ui cursor-pointer"
          @mousedown.prevent="select(tag)"
        >
          {{ tag.name }}
        </li>
        <li
          v-if="canCreate"
          class="tag-option tag-option-create px-3 py-2 text-ui cursor-pointer border-t"
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

<style scoped>
.selected-tag {
  background: var(--color-surface-elevated);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
}

.remove-btn {
  color: var(--color-text-muted);
}
.remove-btn:hover {
  color: var(--color-error);
}

.tag-dropdown {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.tag-option {
  color: var(--color-text-primary);
}
.tag-option:hover {
  background: var(--color-surface-elevated);
}

.tag-option-create {
  color: var(--color-brand);
  border-top-color: var(--color-border);
}
</style>
