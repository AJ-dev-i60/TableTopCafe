import { ref, watch } from 'vue'

export type CatalogueView = 'grid' | 'list'

const STORAGE_KEY = 'ttc-catalogue-view'

export function useCatalogueView() {
  const view = ref<CatalogueView>('grid')

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'grid' || stored === 'list') {
      view.value = stored
    }

    watch(view, (v) => {
      localStorage.setItem(STORAGE_KEY, v)
    })
  }

  function setView(v: CatalogueView) {
    view.value = v
  }

  return { view, setView }
}
