<script setup lang="ts">
import type { StaffGameListItem } from '../../../server/db/queries/games'
import { relativeTime, isRecent } from '../../utils/relativeTime'

const props = defineProps<{
  incoming: { id: number; name: string }
  featured: StaffGameListItem[]
  currentUsername: string | null
  pending: boolean
}>()

const emit = defineEmits<{
  cancel: []
  replace: [outgoingId: number]
}>()

const selectedId = ref<number | null>(null)
const dialogEl = ref<HTMLElement | null>(null)
const failed = reactive<Record<number, boolean>>({})
let previouslyFocused: HTMLElement | null = null

// Oldest pick first → the natural top-down choice bumps the safest (oldest) game.
const ordered = computed(() =>
  [...props.featured].sort((a, b) => {
    const at = a.featuredAt ? new Date(a.featuredAt).getTime() : 0
    const bt = b.featuredAt ? new Date(b.featuredAt).getTime() : 0
    return at - bt
  }),
)

function byLabel(username: string | null): string {
  if (!username) return ''
  return username === props.currentUsername ? 'you' : username
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel')
    return
  }
  if (e.key === 'Tab') trapTab(e)
}

function trapTab(e: KeyboardEvent) {
  const root = dialogEl.value
  if (!root) return
  const focusables = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function confirm() {
  if (selectedId.value !== null) emit('replace', selectedId.value)
}

onMounted(() => {
  previouslyFocused = (document.activeElement as HTMLElement | null) ?? null
  document.addEventListener('keydown', onKeydown)
  nextTick(() => dialogEl.value?.focus())
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  previouslyFocused?.focus?.()
})
</script>

<template>
  <div class="modal-scrim" @click="emit('cancel')">
    <div
      ref="dialogEl"
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-modal-title"
      tabindex="-1"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <h2 id="replace-modal-title" class="text-card-title font-semibold" style="color: var(--color-text-primary)">
          Featured slots are full (3 of 3)
        </h2>
        <button type="button" class="modal-close" aria-label="Close" @click="emit('cancel')">✕</button>
      </div>
      <p class="text-ui mt-1" style="color: var(--color-text-secondary)">
        Choose a featured game to replace with
        <span class="font-semibold" style="color: var(--color-text-primary)">“{{ incoming.name }}”</span>:
      </p>

      <!-- Choices -->
      <div class="choice-list mt-3">
        <label
          v-for="game in ordered"
          :key="game.id"
          class="choice-row"
          :class="selectedId === game.id ? 'choice-selected' : ''"
        >
          <input v-model="selectedId" type="radio" name="replace-choice" :value="game.id" class="choice-radio" />

          <div class="shrink-0 w-9 h-9 overflow-hidden" style="border-radius: var(--radius-sm)">
            <img
              v-if="game.photoHash && !failed[game.id]"
              :src="`/api/photos/${game.photoHash}/thumb.jpg`"
              :alt="game.name"
              class="w-full h-full object-cover"
              @error="failed[game.id] = true"
            />
            <div v-else class="thumb-fallback w-full h-full flex items-center justify-center">
              <span class="text-sm font-bold text-white/60 leading-none select-none" aria-hidden="true">{{ game.name.charAt(0) }}</span>
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-ui font-medium truncate" style="color: var(--color-text-primary)">{{ game.name }}</p>
              <span v-if="isRecent(game.featuredAt)" class="recent-chip shrink-0" aria-hidden="true">◌ recent</span>
            </div>
            <p v-if="game.featuredAt" class="text-meta truncate" style="color: var(--color-text-muted)">
              Featured {{ relativeTime(game.featuredAt) }}<template v-if="game.featuredBy"> · by {{ byLabel(game.featuredBy) }}</template>
            </p>
          </div>
        </label>
      </div>

      <!-- Footer -->
      <div class="flex justify-end items-center gap-3 mt-4">
        <SharedButton variant="secondary" :disabled="pending" @click="emit('cancel')">Cancel</SharedButton>
        <SharedButton
          variant="primary"
          :disabled="selectedId === null"
          :pending="pending"
          pending-label="Replacing…"
          @click="confirm"
        >
          Replace
        </SharedButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-scrim {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(8 18 14 / 0.45);
}

.modal-dialog {
  width: calc(100% - 32px);
  max-width: 420px;
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  outline: none;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
}
.modal-close:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.choice-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.choice-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: 44px;
  cursor: pointer;
  border-left: 2px solid transparent;
}
.choice-row + .choice-row {
  border-top: 1px solid var(--color-border);
}
.choice-row:hover {
  background: var(--color-surface-elevated);
}
.choice-selected {
  background: rgb(21 128 61 / 0.08);
  border-left-color: var(--color-brand);
}

.choice-radio {
  accent-color: var(--color-brand);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.recent-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  font-size: var(--font-size-tag);
  font-weight: 600;
  color: var(--color-brand);
  background: rgb(21 128 61 / 0.10);
  border-radius: var(--radius-full);
}
</style>
