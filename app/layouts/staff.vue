<template>
  <div class="min-h-screen bg-[--color-surface-elevated]">
    <header class="sticky top-0 z-20 bg-white border-b border-[--color-border] shadow-[--shadow-sm]">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <NuxtLink to="/staff" class="text-base font-bold text-[--color-text-primary] tracking-tight hover:text-[--color-brand] transition-colors">
            TableTopCafe
          </NuxtLink>
          <span class="text-xs font-medium text-[--color-text-muted] bg-[--color-surface-elevated] border border-[--color-border] rounded-[--radius-sm] px-2 py-0.5">
            Staff
          </span>
        </div>
        <nav class="flex items-center gap-4">
          <NuxtLink
            to="/staff"
            class="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
            active-class="text-[--color-brand] font-medium"
          >
            Games
          </NuxtLink>
          <NuxtLink
            to="/"
            class="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
          >
            View catalogue
          </NuxtLink>
          <button
            class="text-sm text-[--color-text-secondary] hover:text-[--color-error] transition-colors"
            @click="logout"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/staff/login')
}
</script>
