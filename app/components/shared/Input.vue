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
    class="input"
    :class="invalid ? 'input-invalid' : 'input-normal'"
    @input="onInput"
  />
</template>

<style scoped>
.input {
  display: block;
  width: 100%;
  padding: 9px 11px;
  font-size: var(--font-size-ui);
  font-family: inherit;
  border-radius: var(--radius-md);
  border-width: 1px;
  border-style: solid;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
}

.input-normal {
  border-color: var(--color-border-strong);
}
.input-normal:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.input-invalid {
  border-color: var(--color-error);
}
.input-invalid:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px var(--color-error-ring);
}
</style>
