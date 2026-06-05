export type CatalogueView = 'grid' | 'list'

// useCookie is SSR-safe: the cookie value is read server-side too, so the
// server HTML and the initial client render always agree. The old localStorage
// approach read the value synchronously during client setup AFTER the server
// had already rendered grid-view HTML, causing a Vue hydration mismatch that
// left stale button classes in the DOM while reactive state said otherwise.
export function useCatalogueView() {
  const view = useCookie<CatalogueView>('ttc-catalogue-view', {
    default: () => 'grid' as CatalogueView,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  function setView(v: CatalogueView) {
    view.value = v
  }

  return { view, setView }
}
