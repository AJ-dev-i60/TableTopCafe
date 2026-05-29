<template>
  <div class="min-h-screen bg-[--color-surface-page]">
    <header class="sticky top-0 z-header bg-[--color-surface] border-b border-[--color-border] shadow-[--shadow-sm]">
      <div class="max-w-7xl mx-auto px-md flex items-stretch justify-between gap-4" style="height: 58px">

        <!-- Wordmark -->
        <div class="flex items-center gap-2.5">
          <NuxtLink to="/staff" class="text-base font-bold text-[--color-text-primary] tracking-tight hover:text-[--color-brand] transition-colors">
            TableTopCafe
          </NuxtLink>
          <span class="text-tag font-medium text-[--color-text-muted] bg-[--color-surface-elevated] border border-[--color-border] rounded-[--radius-sm] px-2 py-0.5">
            Staff
          </span>
        </div>

        <!-- Nav links — active state is brand underline via box-shadow -->
        <nav class="flex items-stretch gap-1">
          <NuxtLink
            to="/staff"
            class="nav-link flex items-center px-3 text-ui text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
            active-class="nav-link--active text-[--color-text-primary] font-medium"
            exact
          >
            Games
          </NuxtLink>
          <NuxtLink
            to="/staff/tags"
            class="nav-link flex items-center px-3 text-ui text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
            active-class="nav-link--active text-[--color-text-primary] font-medium"
          >
            Tags
          </NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/staff/users"
            class="nav-link flex items-center px-3 text-ui text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
            active-class="nav-link--active text-[--color-text-primary] font-medium"
          >
            Users
          </NuxtLink>
          <NuxtLink
            to="/"
            class="flex items-center px-3 text-ui text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
          >
            View catalogue
          </NuxtLink>
        </nav>

        <!-- Right: who · role + sign out -->
        <div class="flex items-center gap-4">
          <span class="text-meta text-[--color-text-muted]">{{ currentUser?.username }} · {{ currentUser?.role }}</span>
          <button
            class="text-ui text-[--color-text-secondary] hover:text-[--color-error] transition-colors"
            @click="logout"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-md py-lg">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { data: currentUser } = await useFetch('/api/auth/me')
const isAdmin = computed(() => (currentUser.value as { role?: string } | null)?.role === 'admin')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/staff/login')
}
</script>

<style scoped>
.nav-link--active {
  box-shadow: inset 0 -2px 0 var(--color-brand);
}
</style>
