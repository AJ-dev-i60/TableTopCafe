<template>
  <div>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-1">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">Games</h1>
        <p class="text-meta mt-0.5" style="color: var(--color-text-muted)">
          {{ liveCount }} live · {{ deletedCount }} deleted ·
          <span :style="featuredCount >= 3 ? 'color: var(--color-brand); font-weight: 500' : undefined">Featured {{ featuredCount }} of 3</span>
        </p>
      </div>
      <NuxtLink
        to="/staff/games/new"
        class="add-btn inline-flex items-center gap-1.5 text-ui font-medium px-4 py-2 transition-colors shrink-0"
        style="background: var(--color-brand); color: var(--color-brand-foreground)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add game
      </NuxtLink>
    </div>

    <!-- Segmented filter control -->
    <div class="flex mb-md mt-md">
      <div class="inline-flex overflow-hidden segmented-control">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          class="px-4 py-1.5 text-ui transition-colors"
          :class="filter === opt.value ? 'seg-active' : 'seg-idle'"
          @click="filter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="text-ui" style="color: var(--color-text-muted)">Loading…</div>

    <div v-else-if="!filteredGames.length" class="text-ui" style="color: var(--color-text-muted)">
      {{ filter === 'deleted' ? 'No deleted games.' : filter === 'live' ? 'No live games yet. Add the first one.' : 'No games yet.' }}
    </div>

    <!-- Table -->
    <div v-else class="table-container overflow-hidden" style="background: var(--color-surface)">
      <table class="w-full">
        <thead>
          <tr class="table-header border-b" style="border-color: var(--color-border)">
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-md py-2.5" style="color: var(--color-text-secondary)">Game</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-3 py-2.5 hidden sm:table-cell" style="color: var(--color-text-secondary)">Players</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-3 py-2.5 hidden sm:table-cell" style="color: var(--color-text-secondary)">Play time</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-left px-3 py-2.5" style="color: var(--color-text-secondary)">Featured</th>
            <th class="text-section-label font-semibold uppercase tracking-wider text-right px-md py-2.5" style="color: var(--color-text-secondary)">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y" style="border-color: var(--color-border)">
          <tr
            v-for="game in filteredGames"
            :key="game.id"
            class="table-row transition-colors"
          >
            <!-- Game: thumb + name + featured pill -->
            <td class="px-md py-3">
              <div class="flex items-center gap-3">
                <div class="shrink-0 w-10 h-10 overflow-hidden" style="border-radius: var(--radius-sm)">
                  <img
                    v-if="game.photoHash && !failedThumbs[game.id]"
                    :data-game-id="game.id"
                    :src="`/api/photos/${game.photoHash}/thumb.jpg`"
                    :alt="game.name"
                    loading="lazy"
                    class="w-full h-full object-cover"
                    @error="failedThumbs[game.id] = true"
                  />
                  <div v-else class="thumb-fallback w-full h-full flex items-center justify-center">
                    <span class="text-sm font-bold text-white/60 leading-none select-none" aria-hidden="true">
                      {{ game.name.charAt(0) }}
                    </span>
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-card-title font-medium truncate" style="color: var(--color-text-primary)">{{ game.name }}</p>
                  <p
                    v-if="game.featured && !game.deletedAt && game.featuredAt"
                    class="text-meta mt-0.5 truncate"
                    style="color: var(--color-text-muted)"
                  >
                    Featured {{ relativeTime(game.featuredAt) }}<template v-if="game.featuredBy"> · by {{ byLabel(game.featuredBy) }}</template>
                  </p>
                </div>
              </div>
            </td>

            <td class="px-3 py-3 text-ui hidden sm:table-cell" style="white-space: nowrap; color: var(--color-text-secondary)">
              {{ game.playerMin }}–{{ game.playerMax }}
            </td>

            <td class="px-3 py-3 text-ui hidden sm:table-cell" style="white-space: nowrap; color: var(--color-text-secondary)">
              {{ game.timeMin }}–{{ game.timeMax }} min
            </td>

            <!-- Featured toggle (deleted rows show a non-interactive pill) -->
            <td class="px-3 py-3">
              <span v-if="game.deletedAt" class="pill-deleted inline-block px-2 py-0.5 text-tag">Deleted</span>
              <button
                v-else
                type="button"
                class="feat-toggle text-tag"
                :class="game.featured ? 'feat-on' : 'feat-off'"
                :disabled="pendingId === game.id"
                :aria-pressed="game.featured"
                :title="game.featured
                  ? 'Featured — click to remove'
                  : (featuredCount >= 3 ? '3 of 3 featured — choose one to replace' : 'Click to feature')"
                @click="onToggle(game)"
              >
                <template v-if="pendingId === game.id">
                  <span class="feat-spinner" aria-hidden="true" />
                  {{ game.featured ? 'Removing…' : 'Featuring…' }}
                </template>
                <template v-else-if="game.featured">
                  <span class="feat-rest"><span aria-hidden="true">★</span> Featured</span>
                  <span class="feat-hover"><span aria-hidden="true">✕</span> Remove</span>
                </template>
                <template v-else>
                  <span aria-hidden="true">☆</span> Feature
                </template>
              </button>
            </td>

            <!-- Actions -->
            <td class="px-md py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <template v-if="!game.deletedAt">
                  <SharedButton variant="secondary" :to="`/staff/games/${game.id}/edit`">
                    Edit
                  </SharedButton>
                  <SharedButton variant="danger" @click="deleteGame(game.id, game.name)">
                    Delete
                  </SharedButton>
                </template>
                <template v-else>
                  <SharedButton variant="secondary" @click="restoreGame(game.id, game.name)">
                    Restore
                  </SharedButton>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="actionError" class="mt-3 text-ui" style="color: var(--color-error)">{{ actionError }}</p>

    <StaffFeaturedReplaceModal
      v-if="replaceTarget"
      :incoming="replaceTarget"
      :featured="currentFeatured"
      :current-username="currentUsername"
      :pending="replacing"
      @cancel="replaceTarget = null"
      @replace="onReplaceConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { StaffGameListItem } from '../../../server/db/queries/games'
import { relativeTime } from '../../utils/relativeTime'

definePageMeta({ layout: 'staff', middleware: ['auth'] })

const { data: games, pending, refresh } = await useFetch('/api/staff/games')
const { data: me } = await useFetch('/api/auth/me')
const currentUsername = computed(() => (me.value as { username?: string } | null)?.username ?? null)

function byLabel(username: string): string {
  return username === currentUsername.value ? 'you' : username
}

type FilterValue = 'live' | 'deleted' | 'all'
const filter = ref<FilterValue>('live')

const filterOptions: { label: string; value: FilterValue }[] = [
  { label: 'Live', value: 'live' },
  { label: 'Deleted', value: 'deleted' },
  { label: 'All', value: 'all' },
]

const liveCount = computed(() => games.value?.filter((g) => !g.deletedAt).length ?? 0)
const deletedCount = computed(() => games.value?.filter((g) => !!g.deletedAt).length ?? 0)
const currentFeatured = computed(() => games.value?.filter((g) => g.featured && !g.deletedAt) ?? [])
const featuredCount = computed(() => currentFeatured.value.length)

const filteredGames = computed(() => {
  if (!games.value) return []
  if (filter.value === 'live') return games.value.filter((g) => !g.deletedAt)
  if (filter.value === 'deleted') return games.value.filter((g) => !!g.deletedAt)
  return games.value
})

const failedThumbs = reactive<Record<number, boolean>>({})

// Errors that fire before Vue hydrates the @error listener are lost. After
// each render, sweep all thumb <img>s and flag any that already failed —
// catches the SSR-hydration race. Lazy images that haven't started loading
// have empty currentSrc, so this won't false-positive them.
function syncFailedThumbs() {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-game-id]')) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
      failedThumbs[Number(img.dataset.gameId)] = true
    }
  }
}

onMounted(syncFailedThumbs)
// After refresh() or filter change re-renders the table
watch(filteredGames, () => nextTick(syncFailedThumbs))

async function deleteGame(id: number, name: string) {
  if (!confirm(`Delete "${name}"? It will be hidden from the catalogue.`)) return
  await $fetch(`/api/staff/games/${id}`, { method: 'DELETE' })
  await refresh()
}

async function restoreGame(id: number, name: string) {
  if (!confirm(`Restore "${name}"? It will reappear in the catalogue.`)) return
  await $fetch(`/api/staff/games/${id}/restore`, { method: 'POST' })
  await refresh()
}

// ── Featured toggle ──────────────────────────────────────────────────────────
const pendingId = ref<number | null>(null)
const actionError = ref('')
const replaceTarget = ref<{ id: number; name: string } | null>(null)
const replacing = ref(false)

function onToggle(game: StaffGameListItem) {
  if (pendingId.value !== null) return
  if (game.featured) {
    void unfeature(game)
    return
  }
  // Featuring at the cap opens the replace-picker instead of failing.
  if (featuredCount.value >= 3) {
    replaceTarget.value = { id: game.id, name: game.name }
    return
  }
  void feature(game)
}

async function feature(game: StaffGameListItem) {
  pendingId.value = game.id
  actionError.value = ''
  try {
    await $fetch(`/api/staff/games/${game.id}/feature`, { method: 'POST' })
    await refresh()
  } catch (err: unknown) {
    // Safety net: cap filled between render and click → open the picker.
    const status = (err as { statusCode?: number }).statusCode
    if (status === 422) {
      replaceTarget.value = { id: game.id, name: game.name }
    } else {
      actionError.value = 'Could not feature that game. Please try again.'
    }
  } finally {
    pendingId.value = null
  }
}

async function unfeature(game: StaffGameListItem) {
  pendingId.value = game.id
  actionError.value = ''
  try {
    await $fetch(`/api/staff/games/${game.id}/unfeature`, { method: 'POST' })
    await refresh()
  } catch {
    actionError.value = 'Could not remove that game from featured. Please try again.'
  } finally {
    pendingId.value = null
  }
}

async function onReplaceConfirm(outgoingId: number) {
  if (!replaceTarget.value) return
  replacing.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/staff/games/${replaceTarget.value.id}/feature`, {
      method: 'POST',
      body: { replace: outgoingId },
    })
    replaceTarget.value = null
    await refresh()
  } catch {
    actionError.value = 'Could not replace the featured game. Please try again.'
  } finally {
    replacing.value = false
  }
}
</script>

<style scoped>
.add-btn {
  border-radius: var(--radius-md);
}
.add-btn:hover {
  background: var(--color-brand-hover) !important;
}

.segmented-control {
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.seg-active {
  background: var(--color-brand);
  color: var(--color-brand-foreground);
  font-weight: 500;
}

.seg-idle {
  background: var(--color-surface);
  color: var(--color-text-secondary);
}
.seg-idle:hover {
  background: var(--color-surface-elevated);
}

.table-container {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.table-header {
  background: var(--color-surface-elevated);
}

.table-row:hover {
  background: var(--color-surface-elevated);
}

.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.pill-live {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border-radius: var(--radius-full);
}

.pill-deleted {
  background: var(--color-error-soft);
  color: var(--color-error);
  border-radius: var(--radius-full);
}

.pill-featured {
  background: rgb(21 128 61 / 0.12);
  color: var(--color-brand);
  border-radius: var(--radius-full);
}

/* Featured toggle button (replaces the static status pill) */
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
