<script setup lang="ts">
const { public: { buildNumber } } = useRuntimeConfig()

const atTop = ref(true)
function onScroll() { atTop.value = window.scrollY === 0 }

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="min-h-screen [background:var(--mesh-bg)]">
    <header :class="['fixed top-0 left-0 right-0 z-header glass-chrome border-b header-bar', atTop ? '' : 'header-hidden']">
      <div class="max-w-7xl mx-auto px-md py-3 flex items-center justify-between">
        <span class="flex items-baseline gap-2">
          <span class="text-base font-bold tracking-tight" style="color: var(--color-text-primary)">Table-Top-Cafe</span>
          <span class="text-xs" style="color: var(--color-text-muted)">{{ buildNumber }}</span>
        </span>
        <slot name="header-actions" />
      </div>
    </header>

    <main class="content-offset">
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

.header-bar {
  transition: transform 220ms ease;
}
.header-hidden {
  transform: translateY(-100%);
}

/* Offset page content below the fixed header.
   On iPhone with notch, safe-area-inset-top can be ~44px so the header grows;
   the formula keeps content clear in both cases. */
.content-offset {
  padding-top: 52px;
}
@supports (padding-top: env(safe-area-inset-top)) {
  .content-offset {
    padding-top: max(52px, calc(env(safe-area-inset-top) + 36px));
  }
}
</style>
