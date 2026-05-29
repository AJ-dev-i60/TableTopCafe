<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | number
  invalid?: boolean
  modelModifiers?: { number?: boolean }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update:modelValue', props.modelModifiers?.number ? Number(raw) : raw)
}
</script>

<template>
  <input
    :value="modelValue"
    :aria-invalid="invalid || undefined"
    :class="[
      'w-full border rounded-[--radius-md] px-3 py-2 text-ui text-[--color-text-primary]',
      'bg-[--color-surface] focus:outline-none focus:ring-2 focus:border-transparent',
      invalid
        ? 'border-[--color-error] focus:ring-[--color-error]'
        : 'border-[--color-border] focus:ring-[--color-brand]',
    ]"
    @input="onInput"
  />
</template>
