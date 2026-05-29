<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'danger'
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
      'text-ui transition-colors',
      variant === 'primary'
        ? 'bg-[--color-brand] hover:bg-[--color-brand-hover] disabled:opacity-60 text-[--color-brand-foreground] font-medium rounded-[--radius-md] px-4 py-2'
        : 'text-[--color-error] hover:underline disabled:opacity-60',
    ]"
  >
    {{ pending && pendingLabel ? pendingLabel : null }}
    <slot v-if="!(pending && pendingLabel)" />
  </button>
</template>
