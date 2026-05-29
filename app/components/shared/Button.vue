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
    class="btn"
    :class="`btn-${variant}`"
  >
    {{ pending && pendingLabel ? pendingLabel : null }}
    <slot v-if="!(pending && pendingLabel)" />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 150ms, color 150ms, opacity 150ms;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-primary {
  padding: 9px 16px;
  background: var(--color-brand);
  color: var(--color-brand-foreground);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-hover);
}

.btn-secondary {
  padding: 9px 16px;
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-elevated);
}

.btn-danger {
  padding: 6px 12px;
  background: var(--color-surface);
  border-color: var(--color-error);
  color: var(--color-error);
}
.btn-danger:hover:not(:disabled) {
  background: var(--color-error-soft);
}

.btn-ghost {
  padding: 6px 8px;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
}
.btn-ghost:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}
</style>
