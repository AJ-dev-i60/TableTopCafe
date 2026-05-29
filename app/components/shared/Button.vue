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
    :class="[
      'inline-flex items-center justify-center text-ui font-medium rounded-[--radius-md] transition-colors disabled:opacity-60',
      variant === 'primary'  && 'px-4 py-2 bg-[--color-brand] hover:bg-[--color-brand-hover] text-[--color-brand-foreground]',
      variant === 'secondary' && 'px-4 py-2 bg-[--color-surface] border border-[--color-border-strong] text-[--color-text-primary] hover:bg-[--color-surface-elevated]',
      variant === 'danger'   && 'px-3 py-1.5 bg-[--color-surface] border border-[--color-error] text-[--color-error] hover:bg-[--color-error-soft]',
      variant === 'ghost'    && 'p-1.5 text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-elevated]',
    ]"
  >
    {{ pending && pendingLabel ? pendingLabel : null }}
    <slot v-if="!(pending && pendingLabel)" />
  </button>
</template>
