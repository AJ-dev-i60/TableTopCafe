<script setup lang="ts">
const { public: { buildNumber } } = useRuntimeConfig()
</script>

<template>
  <div class="min-h-screen bg-[--color-surface]">
    <header class="sticky top-0 z-header bg-[--color-surface] border-b border-[--color-border] shadow-[--shadow-sm]">
      <div class="max-w-7xl mx-auto px-md py-3 flex items-center justify-between">
        <span class="flex items-baseline gap-2">
          <span class="text-base font-bold text-[--color-text-primary] tracking-tight">TableTopCafe</span>
          <span class="text-xs text-[--color-text-muted]">build {{ buildNumber }}</span>
        </span>
        <slot name="header-actions" />
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="border-t border-[--color-border] mt-auto">
      <div class="max-w-7xl mx-auto px-md py-4">
        <p class="text-xs text-[--color-text-muted] text-center">
          This catalogue shows our game library — not real-time availability.
          Ask a staff member to grab a game for you.
        </p>
      </div>
    </footer>
  </div>
</template>
