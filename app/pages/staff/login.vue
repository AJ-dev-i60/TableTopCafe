<template>
  <div class="login-page min-h-screen flex items-center justify-center p-4">
    <div class="login-card w-full">
      <div class="login-header">
        <p class="login-brand">TableTopCafe</p>
        <p class="login-sub">Staff sign in</p>
      </div>

      <form @submit.prevent="submit">
        <div class="login-field">
          <label for="username" class="login-label">Username</label>
          <SharedInput
            id="username"
            v-model="form.username"
            type="text"
            autocomplete="username"
            required
            :invalid="!!error"
          />
        </div>

        <div class="login-field">
          <label for="password" class="login-label">Password</label>
          <SharedInput
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            :invalid="!!error"
          />
        </div>

        <div aria-live="assertive" class="login-error">
          {{ error }}
        </div>

        <SharedButton
          type="submit"
          class="login-submit"
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
.login-page {
  background: var(--color-surface-page);
}

.login-card {
  max-width: 360px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 30px 28px;
}

.login-header {
  text-align: center;
  margin-bottom: 22px;
}

.login-brand {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.login-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.login-field {
  margin-bottom: 14px;
}

.login-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.login-error {
  min-height: 20px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-error);
}

.login-submit {
  width: 100%;
  justify-content: center;
}
</style>
