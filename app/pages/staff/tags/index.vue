<template>
  <div>
    <h1 class="text-2xl font-bold text-[--color-text-primary] mb-1">Tags</h1>
    <p class="text-meta text-[--color-text-muted] mb-lg">{{ activeCount }} active · {{ archivedCount }} archived</p>

    <div v-if="pending" class="text-sm text-[--color-text-muted]">Loading…</div>

    <template v-else>
      <!-- Active tags -->
      <div v-if="activeTags.length" class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] divide-y divide-[--color-border] mb-lg">
        <div
          v-for="tag in activeTags"
          :key="tag.id"
          class="px-md py-3"
        >
          <!-- Normal row -->
          <div v-if="editingId !== tag.id && mergingId !== tag.id" class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <span class="text-card-title font-medium text-[--color-text-primary]">{{ tag.name }}</span>
              <span class="ml-2 text-meta text-[--color-text-muted]">{{ tag.gameCount }} {{ tag.gameCount === 1 ? 'game' : 'games' }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button class="text-ui text-[--color-brand] hover:underline" @click="startEdit(tag)">Rename</button>
              <button class="text-ui text-[--color-text-secondary] hover:underline" @click="startMerge(tag)">Merge into…</button>
              <SharedButton variant="danger" @click="archiveTag(tag.id, tag.name)">Archive</SharedButton>
            </div>
          </div>

          <!-- Rename form -->
          <div v-else-if="editingId === tag.id" class="flex items-center gap-2">
            <SharedInput
              v-model="editName"
              type="text"
              maxlength="100"
              class="flex-1"
              @keydown.enter.prevent="submitRename(tag.id)"
              @keydown.escape="cancelEdit"
            />
            <SharedButton :pending="renamePending" pending-label="Saving…" @click="submitRename(tag.id)">Save</SharedButton>
            <button class="text-ui text-[--color-text-muted] hover:text-[--color-text-primary]" @click="cancelEdit">Cancel</button>
            <p v-if="renameError" class="text-meta text-[--color-error] ml-1">{{ renameError }}</p>
          </div>

          <!-- Merge picker -->
          <div v-else-if="mergingId === tag.id" class="flex items-center gap-2 flex-wrap">
            <span class="text-ui text-[--color-text-secondary]">Merge <strong>{{ tag.name }}</strong> into:</span>
            <select
              v-model="mergeTargetId"
              class="border border-[--color-border] rounded-[--radius-md] px-3 py-1.5 text-ui text-[--color-text-primary] bg-[--color-surface] focus:outline-none focus:ring-2 focus:ring-[--color-brand]"
            >
              <option :value="null" disabled>Select target tag…</option>
              <option v-for="t in otherActiveTags(tag.id)" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <SharedButton :disabled="!mergeTargetId" :pending="mergePending" pending-label="Merging…" @click="submitMerge(tag.id, tag.name)">Merge</SharedButton>
            <button class="text-ui text-[--color-text-muted] hover:text-[--color-text-primary]" @click="cancelMerge">Cancel</button>
            <p v-if="mergeError" class="text-meta text-[--color-error] ml-1">{{ mergeError }}</p>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-[--color-text-muted] mb-lg">No active tags yet.</p>

      <!-- Archived tags -->
      <template v-if="archivedTags.length">
        <h2 class="text-base font-semibold text-[--color-text-secondary] mb-2">Archived</h2>
        <div class="bg-[--color-surface] rounded-[--radius-lg] border border-[--color-border] divide-y divide-[--color-border] opacity-60">
          <div
            v-for="tag in archivedTags"
            :key="tag.id"
            class="flex items-center justify-between px-md py-3 gap-4"
          >
            <div class="min-w-0">
              <span class="text-card-title font-medium text-[--color-text-primary] line-through">{{ tag.name }}</span>
              <span class="ml-2 text-meta text-[--color-text-muted]">{{ tag.gameCount }} {{ tag.gameCount === 1 ? 'game' : 'games' }}</span>
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

const activeTags = computed(() => tags.value?.filter((t) => !t.archivedAt) ?? [])
const archivedTags = computed(() => tags.value?.filter((t) => !!t.archivedAt) ?? [])
const activeCount = computed(() => activeTags.value.length)
const archivedCount = computed(() => archivedTags.value.length)

function otherActiveTags(excludeId: number) {
  return activeTags.value.filter((t) => t.id !== excludeId)
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
  const targetName = activeTags.value.find((t) => t.id === mergeTargetId.value)?.name ?? 'the target tag'
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
