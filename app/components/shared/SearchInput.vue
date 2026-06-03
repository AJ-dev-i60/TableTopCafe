<script setup lang="ts">
// Small client-side filter box: magnifier icon, text input, and a clear button
// that appears once there's a query. Bind with v-model.
defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="search">
    <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder ?? 'Search…'"
      class="search-input"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="search-clear"
      aria-label="Clear search"
      @click="emit('update:modelValue', '')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.search {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 11px;
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 9px 36px;
  font-size: var(--font-size-ui);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
}
.search-input::-webkit-search-cancel-button {
  display: none;
}
.search-input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.search-clear {
  position: absolute;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
}
.search-clear:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}
</style>
