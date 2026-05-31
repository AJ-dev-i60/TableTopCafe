<template>
  <div class="min-h-screen" style="background: var(--color-surface-page)">
    <header class="sticky top-0 z-header border-b" style="background: var(--color-surface); border-color: var(--color-border); box-shadow: var(--shadow-sm)">
      <div class="max-w-7xl mx-auto px-md flex items-stretch justify-between gap-4" style="height: 58px">

        <!-- Wordmark -->
        <div class="flex items-center gap-2.5">
          <NuxtLink to="/staff" class="text-base font-bold tracking-tight hover:underline" style="color: var(--color-text-primary)">
            TableTopCafe
          </NuxtLink>
          <span class="text-tag font-medium px-2 py-0.5" style="color: var(--color-text-muted); background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-sm)">
            Staff
          </span>
        </div>

        <!-- Nav links — active state via brand underline box-shadow -->
        <nav class="flex items-stretch gap-1">
          <NuxtLink
            to="/staff"
            class="nav-link flex items-center px-3 text-ui transition-colors"
            active-class="nav-link--active font-medium"
            style="color: var(--color-text-secondary)"
            exact
          >
            Games
          </NuxtLink>
          <NuxtLink
            to="/staff/tags"
            class="nav-link flex items-center px-3 text-ui transition-colors"
            active-class="nav-link--active font-medium"
            style="color: var(--color-text-secondary)"
          >
            Tags
          </NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/staff/users"
            class="nav-link flex items-center px-3 text-ui transition-colors"
            active-class="nav-link--active font-medium"
            style="color: var(--color-text-secondary)"
          >
            Users
          </NuxtLink>
          <NuxtLink
            to="/staff/catalogue"
            class="nav-link flex items-center px-3 text-ui transition-colors"
            active-class="nav-link--active font-medium"
            style="color: var(--color-text-secondary)"
          >
            View catalogue
          </NuxtLink>
        </nav>

        <!-- Right: who · role + sign out -->
        <div class="flex items-center gap-4">
          <span class="text-meta" style="color: var(--color-text-muted)">{{ currentUser?.username }} · {{ currentUser?.role }}</span>
          <button
            class="text-ui transition-colors hover:underline"
            style="color: var(--color-text-secondary)"
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
  color: var(--color-text-primary) !important;
  box-shadow: inset 0 -2px 0 var(--color-brand);
}
</style>
