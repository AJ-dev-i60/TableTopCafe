<template>
  <div class="min-h-screen bg-[--color-surface-elevated] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-white rounded-[--radius-lg] shadow-[--shadow-md] p-8">
      <h1 class="text-2xl font-bold text-[--color-text-primary] mb-sm">Staff login</h1>
      <p class="text-ui text-[--color-text-muted] mb-lg">TableTopCafe management</p>

      <form @submit.prevent="submit">
        <div class="mb-md">
          <label for="username" class="block text-ui font-medium text-[--color-text-secondary] mb-1">
            Username
          </label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            autocomplete="username"
            required
            class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-ui text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
          />
        </div>

        <div class="mb-lg">
          <label for="password" class="block text-ui font-medium text-[--color-text-secondary] mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full border border-[--color-border] rounded-[--radius-md] px-3 py-2 text-ui text-[--color-text-primary] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-brand] focus:border-transparent"
          />
        </div>

        <div aria-live="assertive" class="mb-md min-h-5 text-ui" style="color: var(--color-error);">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="pending"
          class="w-full bg-[--color-brand] hover:bg-[--color-brand-hover] disabled:opacity-60 text-white text-ui font-medium rounded-[--radius-md] px-4 py-2 transition-colors"
        >
          {{ pending ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, ssr: false })

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
