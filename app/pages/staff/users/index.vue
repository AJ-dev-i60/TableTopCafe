<template>
  <div>
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">Users</h1>
      <SharedButton @click="showAddForm = !showAddForm">
        {{ showAddForm ? 'Cancel' : 'Add user' }}
      </SharedButton>
    </div>

    <!-- Add user form -->
    <div v-if="showAddForm" class="card border p-6 mb-lg">
      <h2 class="text-base font-semibold mb-md" style="color: var(--color-text-primary)">New account</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-md mb-md">
        <div>
          <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Username *</label>
          <SharedInput v-model="newUser.username" type="text" maxlength="100" />
        </div>
        <div>
          <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">
            Password *
            <span class="font-normal" style="color: var(--color-text-muted)">(min 8 chars)</span>
          </label>
          <SharedInput v-model="newUser.password" type="password" />
        </div>
      </div>
      <div class="mb-md">
        <label class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">Role</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-ui" style="color: var(--color-text-primary)">
            <input v-model="newUser.role" type="radio" value="staff" /> Staff
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-ui" style="color: var(--color-text-primary)">
            <input v-model="newUser.role" type="radio" value="admin" /> Admin
          </label>
        </div>
      </div>
      <p v-if="addError" class="text-ui mb-2" style="color: var(--color-error)">{{ addError }}</p>
      <SharedButton :pending="addPending" pending-label="Creating…" @click="submitAdd">Create account</SharedButton>
    </div>

    <div v-if="pending" class="text-sm" style="color: var(--color-text-muted)">Loading…</div>

    <div v-else-if="!users?.length" class="text-sm" style="color: var(--color-text-muted)">No users found.</div>

    <div v-else class="card border user-list">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-row px-md py-3"
      >
        <!-- Normal row -->
        <div v-if="resettingId !== user.id" class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <span class="text-card-title font-medium" style="color: var(--color-text-primary)">{{ user.username }}</span>
            <span
              class="role-pill ml-2 text-tag font-medium px-2 py-0.5"
              :class="user.role === 'admin' ? 'role-pill-admin' : 'role-pill-staff'"
            >
              {{ user.role }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="text-ui hover:underline" style="color: var(--color-brand)" @click="startReset(user.id)">Reset password</button>
            <SharedButton
              variant="danger"
              :disabled="user.id === currentUserId"
              @click="deleteUser(user.id, user.username)"
            >
              Delete
            </SharedButton>
          </div>
        </div>

        <!-- Reset password inline form -->
        <div v-else class="flex items-center gap-2 flex-wrap">
          <span class="text-ui" style="color: var(--color-text-secondary)">New password for <strong>{{ user.username }}</strong>:</span>
          <SharedInput
            v-model="resetPassword"
            type="password"
            placeholder="Min 8 characters"
            class="flex-1 min-w-40"
            @keydown.enter.prevent="submitReset(user.id)"
            @keydown.escape="cancelReset"
          />
          <SharedButton :pending="resetPending" pending-label="Saving…" @click="submitReset(user.id)">Save</SharedButton>
          <button class="cancel-link text-ui" @click="cancelReset">Cancel</button>
          <p v-if="resetError" class="text-meta w-full" style="color: var(--color-error)">{{ resetError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'staff', middleware: ['admin'] })

const { data: me } = await useFetch('/api/auth/me')
const currentUserId = computed(() => (me.value as { id: number } | null)?.id ?? -1)

const { data: users, pending, refresh } = await useFetch('/api/staff/users')

// ─── Add user ─────────────────────────────────────────────────────────────────

const showAddForm = ref(false)
const newUser = reactive({ username: '', password: '', role: 'staff' as 'staff' | 'admin' })
const addPending = ref(false)
const addError = ref('')

async function submitAdd() {
  if (!newUser.username.trim() || newUser.password.length < 8) {
    addError.value = 'Username required and password must be at least 8 characters.'
    return
  }
  addPending.value = true
  addError.value = ''
  try {
    await $fetch('/api/staff/users', { method: 'POST', body: { ...newUser } })
    newUser.username = ''
    newUser.password = ''
    newUser.role = 'staff'
    showAddForm.value = false
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    addError.value = msg ?? 'Failed to create user.'
  } finally {
    addPending.value = false
  }
}

// ─── Reset password ───────────────────────────────────────────────────────────

const resettingId = ref<number | null>(null)
const resetPassword = ref('')
const resetPending = ref(false)
const resetError = ref('')

function startReset(id: number) {
  resettingId.value = id
  resetPassword.value = ''
  resetError.value = ''
}

function cancelReset() {
  resettingId.value = null
  resetPassword.value = ''
  resetError.value = ''
}

async function submitReset(id: number) {
  if (resetPassword.value.length < 8) {
    resetError.value = 'Password must be at least 8 characters.'
    return
  }
  resetPending.value = true
  resetError.value = ''
  try {
    await $fetch(`/api/staff/users/${id}/reset-password`, { method: 'POST', body: { password: resetPassword.value } })
    cancelReset()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    resetError.value = msg ?? 'Failed to reset password.'
  } finally {
    resetPending.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteUser(id: number, username: string) {
  if (!confirm(`Delete "${username}"? This cannot be undone and will sign them out immediately.`)) return
  try {
    await $fetch(`/api/staff/users/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    alert(msg ?? 'Failed to delete user.')
  }
}
</script>

<style scoped>
.card {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
}

.user-list > .user-row + .user-row {
  border-top: 1px solid var(--color-border);
}

.role-pill {
  border-radius: var(--radius-sm);
}

.role-pill-admin {
  background: rgb(21 128 61 / 0.12);
  color: var(--color-brand);
}

.role-pill-staff {
  background: var(--color-surface-elevated);
  color: var(--color-text-muted);
}

.cancel-link {
  color: var(--color-text-muted);
}
.cancel-link:hover {
  color: var(--color-text-primary);
}
</style>
