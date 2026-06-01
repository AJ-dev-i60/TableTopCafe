<script setup lang="ts">
// Full-screen detail layout: the title bar carries a back link to the
// catalogue in place of the wordmark, so an opened game reads as its own
// screen rather than a card floating inside the catalogue chrome.
</script>

<template>
  <div class="min-h-screen flex flex-col [background:var(--mesh-bg)]">
    <header class="sticky top-0 z-header glass-chrome border-b">
      <div class="max-w-7xl mx-auto px-md py-3 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="back-link inline-flex items-center gap-1.5 text-base font-bold tracking-tight focus:outline-none focus-visible:ring-2"
          style="color: var(--color-text-primary)"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Catalogue
        </NuxtLink>
        <slot name="header-actions" />
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="mt-auto px-md pt-lg pb-8">
      <div class="max-w-7xl mx-auto">
        <div class="glass-chrome glass-panel border px-md py-4">
          <p class="text-ui text-center" style="color: var(--color-text-secondary)">
            This catalogue shows our game library — not real-time availability.
            Ask a staff member to grab a game for you.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.glass-chrome {
  background: var(--glass-fill);
  border-color: var(--glass-stroke);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
}

.glass-panel {
  border-radius: var(--radius-xl);
}

.back-link {
  border-radius: var(--radius-md);
}
.back-link:hover {
  color: var(--color-brand);
}

/* PWA safe-area: notch compensation for installed app on iPhone */
header {
  padding-top: max(12px, env(safe-area-inset-top));
}
</style>
