<script setup lang="ts">
defineProps<{
  featured: boolean
  pending: boolean
  atCap: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="feat-toggle text-tag"
    :class="featured ? 'feat-on' : 'feat-off'"
    :disabled="pending"
    :aria-pressed="featured"
    :title="featured
      ? 'Featured — click to remove'
      : (atCap ? '3 of 3 featured — choose one to replace' : 'Click to feature')"
    @click="$emit('toggle')"
  >
    <template v-if="pending">
      <span class="feat-spinner" aria-hidden="true" />
      {{ featured ? 'Removing…' : 'Featuring…' }}
    </template>
    <template v-else-if="featured">
      <span class="feat-rest"><span aria-hidden="true">★</span> Featured</span>
      <span class="feat-hover"><span aria-hidden="true">✕</span> Remove</span>
    </template>
    <template v-else>
      <span aria-hidden="true">☆</span> Feature
    </template>
  </button>
</template>

<style scoped>
.feat-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 92px;
  padding: 4px 10px;
  font-weight: 600;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}
.feat-toggle:disabled {
  cursor: default;
  opacity: 0.7;
}
.feat-toggle:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: no-preference) {
  .feat-toggle {
    transition: background-color var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
  }
}

/* On = currently featured: resting brand pill, hover reveals destructive "Remove" */
.feat-on {
  background: rgb(21 128 61 / 0.12);
  border-color: rgb(21 128 61 / 0.28);
  color: var(--color-brand);
}
.feat-on .feat-hover {
  display: none;
}
.feat-on:hover:not(:disabled) {
  background: var(--color-error-soft);
  border-color: var(--color-error);
  color: var(--color-error);
}
.feat-on:hover:not(:disabled) .feat-rest {
  display: none;
}
.feat-on:hover:not(:disabled) .feat-hover {
  display: inline;
}

/* Off = not featured: neutral "empty slot", hover previews the brand state */
.feat-off {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}
.feat-off:hover:not(:disabled) {
  background: rgb(21 128 61 / 0.08);
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.feat-spinner {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: feat-spin 0.6s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .feat-spinner {
    animation: none;
  }
}
@keyframes feat-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
