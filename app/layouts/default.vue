<script setup lang="ts">
const { public: { buildNumber } } = useRuntimeConfig()
</script>

<template>
  <div class="min-h-screen [background:var(--mesh-bg)]">
    <header class="sticky top-0 z-header glass-chrome border-b">
      <div class="max-w-7xl mx-auto px-md py-3 flex items-center justify-between">
        <span class="flex items-baseline gap-2">
          <span class="text-base font-bold tracking-tight" style="color: var(--color-text-primary)">Table-Top-Cafe</span>
          <span class="text-xs" style="color: var(--color-text-muted)">#{{ buildNumber }}</span>
        </span>
        <slot name="header-actions" />
      </div>
    </header>

    <main>
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

/* PWA safe-area: notch compensation for installed app on iPhone */
header {
  padding-top: max(12px, env(safe-area-inset-top));
}
</style>
