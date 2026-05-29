<template>
  <div class="min-h-screen bg-[--color-surface-page] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-[--color-surface] rounded-[--radius-lg] shadow-[--shadow-md] p-8">
      <div class="mb-lg">
        <h1 class="text-base font-bold text-[--color-text-primary] tracking-tight mb-1">TableTopCafe</h1>
        <p class="text-body font-semibold text-[--color-text-primary]">Staff sign in</p>
      </div>

      <form @submit.prevent="submit">
        <div class="mb-md">
          <label for="username" class="block text-ui font-medium text-[--color-text-secondary] mb-1">
            Username
          </label>
          <SharedInput
            id="username"
            v-model="form.username"
            type="text"
            autocomplete="username"
            required
            :invalid="!!error"
          />
        </div>

        <div class="mb-lg">
          <label for="password" class="block text-ui font-medium text-[--color-text-secondary] mb-1">
            Password
          </label>
          <SharedInput
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            :invalid="!!error"
          />
        </div>

        <div aria-live="assertive" class="mb-md min-h-5 text-ui" style="color: var(--color-error);">
          {{ error }}
        </div>

        <SharedButton
          type="submit"
          class="w-full"
          :pending="pending"
          pending-label="Signing in…"
        >
          Sign in
        </SharedButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const form = reactive({ username: '', password: '' })
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })
    await navigateTo('/staff')
  } catch {
    error.value = 'Invalid username or password.'
  } finally {
    pending.value = false
  }
}
</script>
