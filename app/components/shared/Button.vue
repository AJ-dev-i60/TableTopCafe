<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  to?: string
  disabled?: boolean
  pending?: boolean
  pendingLabel?: string
}>(), {
  variant: 'primary',
  type: 'button',
})
</script>

<template>
  <!-- Renders as a NuxtLink when `to` is set (preserves link a11y: open in new
       tab, middle/ctrl-click) and as a <button> otherwise. type/disabled/pending
       only apply in button mode. -->
  <component
    :is="to ? resolveComponent('NuxtLink') : 'button'"
    :to="to || undefined"
    :type="to ? undefined : type"
    :disabled="to ? undefined : (disabled || pending)"
    class="btn"
    :class="`btn-${variant}`"
  >
    {{ pending && pendingLabel ? pendingLabel : null }}
    <slot v-if="!(pending && pendingLabel)" />
  </component>
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
  text-decoration: none;
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
