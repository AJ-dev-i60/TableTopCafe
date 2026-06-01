<template>
  <div>
    <h1 class="text-2xl font-bold mb-1" style="color: var(--color-text-primary)">Tags</h1>
    <p class="text-meta mb-md" style="color: var(--color-text-muted)">{{ activeCount }} active · {{ archivedCount }} archived</p>

    <div class="max-w-sm mb-lg">
      <SharedSearchInput v-model="search" placeholder="Search tags by name…" />
    </div>

    <div v-if="pending" class="text-sm" style="color: var(--color-text-muted)">Loading…</div>

    <template v-else>
      <!-- Active tags -->
      <div v-if="activeTags.length" class="card border tag-list mb-lg">
        <div
          v-for="tag in activeTags"
          :key="tag.id"
          class="tag-row px-md py-3"
        >
          <!-- Normal row -->
          <div v-if="editingId !== tag.id && mergingId !== tag.id" class="flex items-center justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex items-center gap-2">
              <NuxtLink
                :to="`/staff/tags/${tag.id}`"
                class="tag-name-link text-card-title font-medium"
                style="color: var(--color-text-primary)"
              >
                {{ tag.name }}
              </NuxtLink>
              <button class="icon-btn" aria-label="Rename tag" title="Rename" @click="startEdit(tag)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <span class="text-meta whitespace-nowrap" style="color: var(--color-text-muted)">{{ tag.gameCount }} {{ tag.gameCount === 1 ? 'game' : 'games' }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <SharedButton variant="secondary" @click="startMerge(tag)">Merge into…</SharedButton>
              <SharedButton variant="danger" @click="archiveTag(tag.id, tag.name)">Archive</SharedButton>
            </div>
          </div>

          <!-- Rename form -->
          <div v-else-if="editingId === tag.id" class="flex items-center gap-2 flex-wrap">
            <SharedInput
              v-model="editName"
              type="text"
              maxlength="100"
              class="flex-1"
              @keydown.enter.prevent="submitRename(tag.id)"
              @keydown.escape="cancelEdit"
            />
            <SharedButton :pending="renamePending" pending-label="Saving…" @click="submitRename(tag.id)">Save</SharedButton>
            <button class="cancel-link text-ui" @click="cancelEdit">Cancel</button>
            <p v-if="renameError" class="text-meta ml-1" style="color: var(--color-error)">{{ renameError }}</p>
          </div>

          <!-- Merge picker -->
          <div v-else-if="mergingId === tag.id" class="flex items-center gap-2 flex-wrap">
            <span class="text-ui" style="color: var(--color-text-secondary)">Merge <strong>{{ tag.name }}</strong> into:</span>
            <select
              v-model="mergeTargetId"
              class="merge-select px-3 py-1.5 text-ui border"
            >
              <option :value="null" disabled>Select target tag…</option>
              <option v-for="t in otherActiveTags(tag.id)" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <SharedButton :disabled="!mergeTargetId" :pending="mergePending" pending-label="Merging…" @click="submitMerge(tag.id, tag.name)">Merge</SharedButton>
            <button class="cancel-link text-ui" @click="cancelMerge">Cancel</button>
            <p v-if="mergeError" class="text-meta ml-1" style="color: var(--color-error)">{{ mergeError }}</p>
          </div>
        </div>
      </div>
      <p v-else class="text-sm mb-lg" style="color: var(--color-text-muted)">
        {{ search.trim() ? `No active tags match “${search.trim()}”.` : 'No active tags yet.' }}
      </p>

      <!-- Archived tags -->
      <template v-if="archivedTags.length">
        <h2 class="text-base font-semibold mb-2" style="color: var(--color-text-secondary)">Archived</h2>
        <div class="card border tag-list archived-list">
          <div
            v-for="tag in archivedTags"
            :key="tag.id"
            class="tag-row flex items-center justify-between px-md py-3 gap-4"
          >
            <div class="min-w-0">
              <span class="text-card-title font-medium line-through" style="color: var(--color-text-primary)">{{ tag.name }}</span>
              <span class="ml-2 text-meta" style="color: var(--color-text-muted)">{{ tag.gameCount }} {{ tag.gameCount === 1 ? 'game' : 'games' }}</span>
            </div>
            <SharedButton @click="unarchiveTag(tag.id)">Restore</SharedButton>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { StaffTagItem } from '~/server/db/queries/tags'

definePageMeta({ layout: 'staff', middleware: ['auth'] })

const { data: tags, pending, refresh } = await useFetch('/api/staff/tags')

const allActiveTags = computed(() => tags.value?.filter((t) => !t.archivedAt) ?? [])
const allArchivedTags = computed(() => tags.value?.filter((t) => !!t.archivedAt) ?? [])
const activeCount = computed(() => allActiveTags.value.length)
const archivedCount = computed(() => allArchivedTags.value.length)

// Header counts stay total; the lists below filter by the search query.
const search = ref('')
function matchesSearch(tag: StaffTagItem) {
  const q = search.value.trim().toLowerCase()
  return !q || tag.name.toLowerCase().includes(q)
}
const activeTags = computed(() => allActiveTags.value.filter(matchesSearch))
const archivedTags = computed(() => allArchivedTags.value.filter(matchesSearch))

function otherActiveTags(excludeId: number) {
  return allActiveTags.value.filter((t) => t.id !== excludeId)
}

// ─── Rename ───────────────────────────────────────────────────────────────────

const editingId = ref<number | null>(null)
const editName = ref('')
const renamePending = ref(false)
const renameError = ref('')

function startEdit(tag: StaffTagItem) {
  editingId.value = tag.id
  editName.value = tag.name
  renameError.value = ''
  mergingId.value = null
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  renameError.value = ''
}

async function submitRename(id: number) {
  const name = editName.value.trim()
  if (!name) return
  renamePending.value = true
  renameError.value = ''
  try {
    await $fetch(`/api/staff/tags/${id}`, { method: 'PATCH', body: { name } })
    await refresh()
    cancelEdit()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    renameError.value = msg ?? 'Failed to rename tag.'
  } finally {
    renamePending.value = false
  }
}

// ─── Merge ────────────────────────────────────────────────────────────────────

const mergingId = ref<number | null>(null)
const mergeTargetId = ref<number | null>(null)
const mergePending = ref(false)
const mergeError = ref('')

function startMerge(tag: StaffTagItem) {
  mergingId.value = tag.id
  mergeTargetId.value = null
  mergeError.value = ''
  editingId.value = null
}

function cancelMerge() {
  mergingId.value = null
  mergeTargetId.value = null
  mergeError.value = ''
}

async function submitMerge(sourceId: number, sourceName: string) {
  if (!mergeTargetId.value) return
  const targetName = allActiveTags.value.find((t) => t.id === mergeTargetId.value)?.name ?? 'the target tag'
  if (!confirm(`Merge "${sourceName}" into "${targetName}"? This cannot be undone — "${sourceName}" will be deleted and its games will be re-tagged.`)) return
  mergePending.value = true
  mergeError.value = ''
  try {
    await $fetch(`/api/staff/tags/${sourceId}/merge`, { method: 'POST', body: { targetId: mergeTargetId.value } })
    await refresh()
    cancelMerge()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    mergeError.value = msg ?? 'Failed to merge tags.'
  } finally {
    mergePending.value = false
  }
}

// ─── Archive / unarchive ──────────────────────────────────────────────────────

async function archiveTag(id: number, name: string) {
  if (!confirm(`Archive "${name}"? It will be hidden from filters and the type-ahead.`)) return
  await $fetch(`/api/staff/tags/${id}`, { method: 'DELETE' })
  await refresh()
}

async function unarchiveTag(id: number) {
  await $fetch(`/api/staff/tags/${id}/restore`, { method: 'POST' })
  await refresh()
}
</script>

<style scoped>
.card {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
}

.tag-list > .tag-row + .tag-row {
  border-top: 1px solid var(--color-border);
}

.archived-list {
  opacity: 0.6;
}

.cancel-link {
  color: var(--color-text-muted);
}
.cancel-link:hover {
  color: var(--color-text-primary);
}

.tag-name-link {
  border-radius: var(--radius-sm);
  text-decoration: none;
}
.tag-name-link:hover {
  color: var(--color-brand) !important;
  text-decoration: underline;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
}
.icon-btn:hover {
  background: var(--color-surface-elevated);
  color: var(--color-brand);
}

.merge-select {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  outline: none;
}
.merge-select:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px rgb(21 128 61 / 0.15);
}
</style>
