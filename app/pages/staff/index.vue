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

    <!-- Filter + search -->
    <div class="flex flex-wrap items-center gap-3 mb-md mt-md">
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
      <div class="flex-1 min-w-[220px] max-w-[22rem]">
        <SharedSearchInput v-model="search" placeholder="Search games…" />
      </div>
    </div>

    <div v-if="pending" class="text-ui" style="color: var(--color-text-muted)">Loading…</div>

    <div v-else-if="!filteredGames.length" class="text-ui" style="color: var(--color-text-muted)">
      <template v-if="search.trim()">No games match “{{ search.trim() }}”.</template>
      <template v-else>{{ filter === 'deleted' ? 'No deleted games.' : filter === 'featured' ? 'No featured games yet.' : filter === 'live' ? 'No live games yet. Add the first one.' : 'No games yet.' }}</template>
    </div>

    <template v-else>
    <!-- Table (≥ sm) -->
    <div class="hidden sm:block table-container overflow-hidden" style="background: var(--color-surface)">
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
            :class="game.deletedAt ? '' : 'row-clickable'"
            @click="openEdit(game)"
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
            <td class="px-3 py-3" @click.stop>
              <span v-if="game.deletedAt" class="pill-deleted inline-block px-2 py-0.5 text-tag">Deleted</span>
              <StaffFeaturedToggle
                v-else
                :featured="game.featured"
                :pending="pendingId === game.id"
                :at-cap="featuredCount >= 3"
                @toggle="onToggle(game)"
              />
            </td>

            <!-- Actions -->
            <td class="px-md py-3 text-right" @click.stop>
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

    <!-- Cards (< sm) -->
    <div class="sm:hidden flex flex-col gap-3">
      <div
        v-for="game in filteredGames"
        :key="game.id"
        class="m-card"
        :class="game.deletedAt ? '' : 'row-clickable'"
        @click="openEdit(game)"
      >
        <div class="flex items-start gap-3">
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
              <span class="text-sm font-bold text-white/60 leading-none select-none" aria-hidden="true">{{ game.name.charAt(0) }}</span>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-card-title font-medium truncate" style="color: var(--color-text-primary)">{{ game.name }}</p>
            <p
              v-if="game.featured && !game.deletedAt && game.featuredAt"
              class="text-meta mt-0.5 truncate"
              style="color: var(--color-text-muted)"
            >
              Featured {{ relativeTime(game.featuredAt) }}<template v-if="game.featuredBy"> · by {{ byLabel(game.featuredBy) }}</template>
            </p>
            <p v-else-if="!game.deletedAt" class="text-meta mt-0.5" style="color: var(--color-text-muted)">
              {{ game.playerMin }}–{{ game.playerMax }} players · {{ game.timeMin }}–{{ game.timeMax }} min
            </p>
          </div>
          <div class="shrink-0" @click.stop>
            <span v-if="game.deletedAt" class="pill-deleted inline-block px-2 py-0.5 text-tag">Deleted</span>
            <StaffFeaturedToggle
              v-else
              :featured="game.featured"
              :pending="pendingId === game.id"
              :at-cap="featuredCount >= 3"
              @toggle="onToggle(game)"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-3" @click.stop>
          <template v-if="!game.deletedAt">
            <SharedButton variant="secondary" :to="`/staff/games/${game.id}/edit`" class="flex-1">Edit</SharedButton>
            <SharedButton variant="danger" class="flex-1" @click="deleteGame(game.id, game.name)">Delete</SharedButton>
          </template>
          <SharedButton v-else variant="secondary" class="flex-1" @click="restoreGame(game.id, game.name)">Restore</SharedButton>
        </div>
      </div>
    </div>
    </template>

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

type FilterValue = 'live' | 'featured' | 'deleted' | 'all'
const filter = ref<FilterValue>('live')

const filterOptions: { label: string; value: FilterValue }[] = [
  { label: 'Live', value: 'live' },
  { label: 'Featured', value: 'featured' },
  { label: 'Deleted', value: 'deleted' },
  { label: 'All', value: 'all' },
]

const liveCount = computed(() => games.value?.filter((g) => !g.deletedAt).length ?? 0)
const deletedCount = computed(() => games.value?.filter((g) => !!g.deletedAt).length ?? 0)
const currentFeatured = computed(() => games.value?.filter((g) => g.featured && !g.deletedAt) ?? [])
const featuredCount = computed(() => currentFeatured.value.length)

const search = ref('')

const filteredGames = computed(() => {
  if (!games.value) return []
  let list = games.value
  if (filter.value === 'live') list = list.filter((g) => !g.deletedAt)
  else if (filter.value === 'featured') list = list.filter((g) => g.featured && !g.deletedAt)
  else if (filter.value === 'deleted') list = list.filter((g) => !!g.deletedAt)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((g) => g.name.toLowerCase().includes(q))
  return list
})

function openEdit(game: StaffGameListItem) {
  if (game.deletedAt) return
  navigateTo(`/staff/games/${game.id}/edit`)
}

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

.row-clickable {
  cursor: pointer;
}

.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.pill-deleted {
  background: var(--color-error-soft);
  color: var(--color-error);
  border-radius: var(--radius-full);
}

/* Mobile game card (< sm) */
.m-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}
</style>
