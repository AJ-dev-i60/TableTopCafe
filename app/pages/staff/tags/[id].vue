<template>
  <div>
    <NuxtLink to="/staff/tags" class="back-link inline-flex items-center gap-1 text-ui font-medium mb-3" style="color: var(--color-text-secondary)">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Tags
    </NuxtLink>

    <div class="flex items-center gap-3 mb-1 flex-wrap">
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">{{ tag?.name }}</h1>
      <span v-if="tag?.archivedAt" class="archived-pill text-tag font-medium px-2 py-0.5">Archived</span>
    </div>
    <p class="text-meta mb-lg" style="color: var(--color-text-muted)">
      {{ taggedGames.length }} {{ taggedGames.length === 1 ? 'game has' : 'games have' }} this tag
    </p>

    <div v-if="pending" class="text-sm" style="color: var(--color-text-muted)">Loading…</div>

    <template v-else>
      <!-- Add games -->
      <section class="mb-lg">
        <h2 class="text-section-label font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-secondary)">Add games</h2>
        <div class="max-w-md">
          <SharedSearchInput v-model="addSearch" placeholder="Search games to add…" />
        </div>

        <div v-if="addSearch.trim()" class="card border mt-3 add-results">
          <button
            v-for="game in addCandidates"
            :key="game.id"
            type="button"
            class="add-row flex items-center gap-3 w-full text-left px-md py-2.5"
            @click="addGame(game)"
          >
            <span class="shrink-0 w-9 h-9 overflow-hidden block" style="border-radius: var(--radius-sm)">
              <img
                v-if="game.photoHash && !failedThumbs[game.id]"
                :data-thumb-id="game.id"
                :src="`/api/photos/${game.photoHash}/thumb.jpg`"
                :alt="game.name"
                loading="lazy"
                class="w-full h-full object-cover"
                @error="failedThumbs[game.id] = true"
              />
              <span v-else class="thumb-fallback w-full h-full flex items-center justify-center">
                <span class="text-sm font-bold text-white/60 leading-none select-none" aria-hidden="true">{{ game.name.charAt(0) }}</span>
              </span>
            </span>
            <span class="flex-1 min-w-0 text-ui font-medium truncate" style="color: var(--color-text-primary)">{{ game.name }}</span>
            <span class="add-cta shrink-0 text-ui font-medium" style="color: var(--color-brand)">+ Add</span>
          </button>
          <p v-if="!addCandidates.length" class="px-md py-3 text-ui" style="color: var(--color-text-muted)">
            No untagged games match “{{ addSearch.trim() }}”.
          </p>
        </div>
      </section>

      <!-- Tagged games -->
      <section>
        <h2 class="text-section-label font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-secondary)">Tagged games</h2>
        <div v-if="taggedGames.length" class="card border tagged-list">
          <div
            v-for="game in taggedGames"
            :key="game.id"
            class="tagged-row flex items-center gap-3 px-md py-2.5"
          >
            <span class="shrink-0 w-9 h-9 overflow-hidden block" style="border-radius: var(--radius-sm)">
              <img
                v-if="game.photoHash && !failedThumbs[game.id]"
                :data-thumb-id="game.id"
                :src="`/api/photos/${game.photoHash}/thumb.jpg`"
                :alt="game.name"
                loading="lazy"
                class="w-full h-full object-cover"
                @error="failedThumbs[game.id] = true"
              />
              <span v-else class="thumb-fallback w-full h-full flex items-center justify-center">
                <span class="text-sm font-bold text-white/60 leading-none select-none" aria-hidden="true">{{ game.name.charAt(0) }}</span>
              </span>
            </span>
            <NuxtLink :to="`/staff/games/${game.id}/edit`" class="flex-1 min-w-0 text-ui font-medium truncate game-link" style="color: var(--color-text-primary)">{{ game.name }}</NuxtLink>
            <button
              type="button"
              class="remove-btn shrink-0 inline-flex items-center gap-1 text-ui font-medium px-2 py-1"
              :disabled="pendingId === game.id"
              @click="removeGame(game)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove
            </button>
          </div>
        </div>
        <p v-else class="text-ui" style="color: var(--color-text-muted)">No games have this tag yet. Use the search above to add some.</p>
      </section>

      <p v-if="actionError" class="mt-3 text-ui" style="color: var(--color-error)">{{ actionError }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { StaffGameListItem } from '../../../../server/db/queries/games'
import type { TagGameItem } from '../../../../server/db/queries/tags'

definePageMeta({ layout: 'staff', middleware: ['auth'] })

const route = useRoute()
const id = Number(route.params.id)

const { data, pending, refresh, error } = await useFetch(`/api/staff/tags/${id}`)
if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
}

const tag = computed(() => data.value?.tag ?? null)
const taggedGames = computed<TagGameItem[]>(() => data.value?.games ?? [])

useSeoMeta({ title: () => (tag.value ? `${tag.value.name} — Tags` : 'Tag') })

// All games drive the "add" picker.
const { data: allGames } = await useFetch('/api/staff/games')

const addSearch = ref('')
const taggedIds = computed(() => new Set(taggedGames.value.map((g) => g.id)))

const addCandidates = computed<StaffGameListItem[]>(() => {
  const q = addSearch.value.trim().toLowerCase()
  if (!q) return []
  return (allGames.value ?? [])
    .filter((g) => !g.deletedAt && !taggedIds.value.has(g.id) && g.name.toLowerCase().includes(q))
    .slice(0, 25)
})

const failedThumbs = reactive<Record<number, boolean>>({})
const pendingId = ref<number | null>(null)
const actionError = ref('')

function syncFailedThumbs() {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-thumb-id]')) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
      failedThumbs[Number(img.dataset.thumbId)] = true
    }
  }
}
onMounted(syncFailedThumbs)
watch([taggedGames, addCandidates], () => nextTick(syncFailedThumbs))

async function addGame(game: StaffGameListItem) {
  actionError.value = ''
  try {
    await $fetch(`/api/staff/tags/${id}/games`, { method: 'POST', body: { gameId: game.id } })
    await refresh()
  } catch {
    actionError.value = `Could not add “${game.name}” to this tag.`
  }
}

async function removeGame(game: TagGameItem) {
  pendingId.value = game.id
  actionError.value = ''
  try {
    await $fetch(`/api/staff/tags/${id}/games`, { method: 'DELETE', body: { gameId: game.id } })
    await refresh()
  } catch {
    actionError.value = `Could not remove “${game.name}” from this tag.`
  } finally {
    pendingId.value = null
  }
}
</script>

<style scoped>
.back-link:hover {
  color: var(--color-brand);
}

.card {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.add-results > .add-row + .add-row,
.tagged-list > .tagged-row + .tagged-row {
  border-top: 1px solid var(--color-border);
}

.add-row {
  cursor: pointer;
  transition: background 120ms ease;
}
.add-row:hover {
  background: var(--color-surface-elevated);
}
.add-row:hover .add-cta {
  text-decoration: underline;
}

.game-link:hover {
  color: var(--color-brand) !important;
  text-decoration: underline;
}

.thumb-fallback {
  background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover));
}

.remove-btn {
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease, background 120ms ease;
}
.remove-btn:hover:not(:disabled) {
  color: var(--color-error);
  border-color: var(--color-error);
  background: var(--color-error-soft);
}
.remove-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.archived-pill {
  background: var(--color-surface-elevated);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
}
</style>
