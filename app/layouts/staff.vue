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

        <!-- Desktop nav — active state via brand underline box-shadow -->
        <nav class="hidden sm:flex items-stretch gap-1">
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

        <!-- Desktop right: who · role + sign out -->
        <div class="hidden sm:flex items-center gap-4">
          <span class="text-meta" style="color: var(--color-text-muted)">{{ currentUser?.username }} · {{ currentUser?.role }}</span>
          <button
            class="text-ui transition-colors hover:underline"
            style="color: var(--color-text-secondary)"
            @click="logout"
          >
            Sign out
          </button>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="sm:hidden flex items-center"
          style="color: var(--color-text-secondary)"
          :aria-expanded="mobileMenuOpen"
          aria-controls="staff-mobile-menu"
          aria-label="Toggle menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile menu panel -->
      <nav
        v-if="mobileMenuOpen"
        id="staff-mobile-menu"
        class="sm:hidden border-t"
        style="border-color: var(--color-border)"
      >
        <div class="max-w-7xl mx-auto px-md py-1 flex flex-col">
          <NuxtLink to="/staff" class="mobile-link" active-class="mobile-link--active" exact @click="mobileMenuOpen = false">Games</NuxtLink>
          <NuxtLink to="/staff/tags" class="mobile-link" active-class="mobile-link--active" @click="mobileMenuOpen = false">Tags</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/staff/users" class="mobile-link" active-class="mobile-link--active" @click="mobileMenuOpen = false">Users</NuxtLink>
          <NuxtLink to="/staff/catalogue" class="mobile-link" active-class="mobile-link--active" @click="mobileMenuOpen = false">View catalogue</NuxtLink>
          <div class="flex items-center justify-between py-3 mt-1" style="border-top: 1px solid var(--color-border)">
            <span class="text-meta" style="color: var(--color-text-muted)">{{ currentUser?.username }} · {{ currentUser?.role }}</span>
            <button class="text-ui hover:underline" style="color: var(--color-text-secondary)" @click="logout">Sign out</button>
          </div>
        </div>
      </nav>
    </header>

    <main class="max-w-7xl mx-auto px-md py-lg">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { data: currentUser } = await useFetch('/api/auth/me')
const isAdmin = computed(() => (currentUser.value as { role?: string } | null)?.role === 'admin')

// Mobile nav menu — close it whenever the route changes (covers link taps).
const mobileMenuOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { mobileMenuOpen.value = false })

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

.mobile-link {
  display: block;
  padding: 11px 0;
  font-size: var(--font-size-ui);
  color: var(--color-text-secondary);
}
.mobile-link--active {
  color: var(--color-text-primary);
  font-weight: 500;
}
</style>
