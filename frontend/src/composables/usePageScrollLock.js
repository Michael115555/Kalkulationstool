export const usePageScrollLock = (className) => {
  let pageScrollPosition = 0
  let isPageScrollLocked = false

  const setPageScrollLock = (shouldLock) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }

    const { body, documentElement } = document

    if (shouldLock) {
      if (isPageScrollLocked) {
        return
      }

      isPageScrollLocked = true
      pageScrollPosition = window.scrollY
      body.style.position = 'fixed'
      body.style.top = `-${pageScrollPosition}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.classList.add(className)
      documentElement.classList.add(className)
      return
    }

    if (!isPageScrollLocked) {
      return
    }

    isPageScrollLocked = false
    body.style.position = ''
    body.style.top = ''
    body.style.left = ''
    body.style.right = ''
    body.style.width = ''
    body.classList.remove(className)
    documentElement.classList.remove(className)
    window.scrollTo(0, pageScrollPosition)
  }

  return {
    setPageScrollLock
  }
}
