<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  pending?: boolean
  pendingLabel?: string
}>(), {
  variant: 'primary',
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || pending"
    class="btn inline-flex items-center justify-center text-ui font-medium transition-colors disabled:opacity-60"
    :class="`btn-${variant}`"
  >
    {{ pending && pendingLabel ? pendingLabel : null }}
    <slot v-if="!(pending && pendingLabel)" />
  </button>
</template>

<style scoped>
.btn {
  border-radius: var(--radius-md);
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: var(--color-brand);
  color: var(--color-brand-foreground);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-hover);
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-primary);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-elevated);
}

.btn-danger {
  padding: 0.375rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-error);
  color: var(--color-error);
}
.btn-danger:hover:not(:disabled) {
  background: var(--color-error-soft);
}

.btn-ghost {
  padding: 0.375rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
}
.btn-ghost:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}
</style>
