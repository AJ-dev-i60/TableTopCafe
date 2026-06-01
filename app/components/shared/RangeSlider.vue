<script setup lang="ts">
// Dual-thumb range slider. Two values (low/high) over [min, max], snapped to
// step, with the thumbs unable to cross. Pointer drag (mouse + touch) and full
// keyboard control (arrows / Home / End). Bind with v-model:low / v-model:high.
const props = defineProps<{
  low: number
  high: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  lowLabel?: string
  highLabel?: string
}>()

const emit = defineEmits<{
  'update:low': [value: number]
  'update:high': [value: number]
}>()

const rootEl = ref<HTMLElement | null>(null)
const trackEl = ref<HTMLElement | null>(null)
const dragging = ref<'low' | 'high' | null>(null)

const step = computed(() => props.step ?? 1)

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}

function snap(v: number) {
  const s = step.value
  const snapped = Math.round((v - props.min) / s) * s + props.min
  return clamp(snapped, props.min, props.max)
}

function fmt(v: number) {
  return props.format ? props.format(v) : String(v)
}

// Position as a 0–100% offset, clamped so out-of-range legacy values still sit
// at an edge rather than overflowing the track.
function pct(v: number) {
  return clamp(((v - props.min) / (props.max - props.min)) * 100, 0, 100)
}

const lowPct = computed(() => pct(props.low))
const highPct = computed(() => pct(props.high))

function apply(which: 'low' | 'high', v: number) {
  const snapped = snap(v)
  if (which === 'low') emit('update:low', Math.min(snapped, props.high))
  else emit('update:high', Math.max(snapped, props.low))
}

function valueFromClientX(clientX: number) {
  const track = trackEl.value
  if (!track) return props.min
  const rect = track.getBoundingClientRect()
  const ratio = rect.width === 0 ? 0 : clamp((clientX - rect.left) / rect.width, 0, 1)
  return props.min + ratio * (props.max - props.min)
}

function pickThumb(target: EventTarget | null, v: number): 'low' | 'high' {
  const el = target as HTMLElement | null
  const thumb = el?.dataset?.thumb
  if (thumb === 'low' || thumb === 'high') return thumb
  // Track press: grab whichever thumb is nearer (ties go to low).
  return Math.abs(v - props.low) <= Math.abs(v - props.high) ? 'low' : 'high'
}

function onPointerDown(e: PointerEvent) {
  e.preventDefault()
  const v = valueFromClientX(e.clientX)
  const which = pickThumb(e.target, v)
  dragging.value = which
  rootEl.value?.setPointerCapture(e.pointerId)
  // preventDefault above can swallow focus, so set it explicitly — keyboard
  // nudging then works straight after a press.
  rootEl.value?.querySelector<HTMLElement>(`[data-thumb="${which}"]`)?.focus()
  apply(which, v)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  apply(dragging.value, valueFromClientX(e.clientX))
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value) return
  rootEl.value?.releasePointerCapture?.(e.pointerId)
  dragging.value = null
}

function onKey(which: 'low' | 'high', e: KeyboardEvent) {
  const value = which === 'low' ? props.low : props.high
  const s = step.value
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      apply(which, value + s)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      apply(which, value - s)
      break
    case 'Home':
      apply(which, which === 'low' ? props.min : props.low)
      break
    case 'End':
      apply(which, which === 'low' ? props.high : props.max)
      break
    default:
      return
  }
  e.preventDefault()
}
</script>

<template>
  <div>
    <div class="rs-values">
      <span class="rs-value">{{ fmt(low) }}</span>
      <span class="rs-dash" aria-hidden="true">–</span>
      <span class="rs-value">{{ fmt(high) }}</span>
    </div>

    <div
      ref="rootEl"
      class="rs-root"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div ref="trackEl" class="rs-track">
        <div class="rs-fill" :style="{ left: `${lowPct}%`, right: `${100 - highPct}%` }" />
      </div>

      <button
        type="button"
        data-thumb="low"
        class="rs-thumb"
        :style="{ left: `${lowPct}%` }"
        role="slider"
        :aria-label="lowLabel ?? 'Minimum'"
        :aria-valuemin="min"
        :aria-valuemax="high"
        :aria-valuenow="low"
        :aria-valuetext="fmt(low)"
        @keydown="(e) => onKey('low', e)"
      />
      <button
        type="button"
        data-thumb="high"
        class="rs-thumb"
        :style="{ left: `${highPct}%` }"
        role="slider"
        :aria-label="highLabel ?? 'Maximum'"
        :aria-valuemin="low"
        :aria-valuemax="max"
        :aria-valuenow="high"
        :aria-valuetext="fmt(high)"
        @keydown="(e) => onKey('high', e)"
      />
    </div>

    <div class="rs-ends" aria-hidden="true">
      <span>{{ fmt(min) }}</span>
      <span>{{ fmt(max) }}</span>
    </div>
  </div>
</template>

<style scoped>
.rs-values {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}
.rs-value {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
}
.rs-dash {
  color: var(--color-text-muted);
}

.rs-root {
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  touch-action: none;
}

.rs-track {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
}

.rs-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--color-brand);
  border-radius: var(--radius-full);
}

.rs-thumb {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  transform: translateY(-50%);
  background: var(--color-surface);
  border: 2px solid var(--color-brand);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  cursor: grab;
  touch-action: none;
}
.rs-thumb:active {
  cursor: grabbing;
}
.rs-thumb:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgb(21 128 61 / 0.25);
}

.rs-ends {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: var(--font-size-meta);
  color: var(--color-text-muted);
}
</style>
