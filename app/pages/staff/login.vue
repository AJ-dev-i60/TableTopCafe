<template>
  <div class="min-h-screen flex items-center justify-center p-4" style="background: var(--color-surface-page)">
    <div class="login-card w-full max-w-sm p-8" style="background: var(--color-surface)">
      <div class="mb-lg">
        <h1 class="text-base font-bold tracking-tight mb-1" style="color: var(--color-text-primary)">TableTopCafe</h1>
        <p class="text-body font-semibold" style="color: var(--color-text-primary)">Staff sign in</p>
      </div>

      <form @submit.prevent="submit">
        <div class="mb-md">
          <label for="username" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">
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
          <label for="password" class="block text-ui font-medium mb-1" style="color: var(--color-text-secondary)">
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

        <div aria-live="assertive" class="mb-md min-h-5 text-ui" style="color: var(--color-error)">
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

<style scoped>
.login-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
</style>
