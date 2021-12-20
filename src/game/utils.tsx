export const doOnBack = (fn: (ev: PopStateEvent) => void) => {
  window.history.pushState(null, "")
  window.onpopstate = (e) => {
    e.preventDefault()
    e.stopPropagation()
    window.onpopstate = () => {}
    fn(e)
  }
}
