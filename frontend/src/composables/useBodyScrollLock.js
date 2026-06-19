import { onBeforeUnmount, watch } from 'vue'

let activeLockCount = 0
let lockedScrollY = 0
let savedBodyStyles = null
let savedDocumentStyles = null

const canUseDom = () =>
  typeof window !== 'undefined' &&
  typeof document !== 'undefined' &&
  document.body &&
  document.documentElement

const lockBodyScroll = () => {
  if (!canUseDom()) {
    return
  }

  if (activeLockCount === 0) {
    const { body, documentElement } = document
    const bodyStyle = body.style
    const documentStyle = documentElement.style
    const bodyPaddingRight = window.getComputedStyle(body).paddingRight
    const scrollbarWidth = Math.max(0, window.innerWidth - documentElement.clientWidth)
    const paddingRight = Number.parseFloat(bodyPaddingRight) || 0

    lockedScrollY =
      window.scrollY ||
      documentElement.scrollTop ||
      body.scrollTop ||
      0

    savedBodyStyles = {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
      paddingRight: bodyStyle.paddingRight,
      overscrollBehavior: bodyStyle.overscrollBehavior
    }
    savedDocumentStyles = {
      overscrollBehavior: documentStyle.overscrollBehavior
    }

    bodyStyle.overflow = 'hidden'
    bodyStyle.position = 'fixed'
    bodyStyle.top = `-${lockedScrollY}px`
    bodyStyle.width = '100%'
    bodyStyle.overscrollBehavior = 'none'
    documentStyle.overscrollBehavior = 'none'

    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${paddingRight + scrollbarWidth}px`
    }
  }

  activeLockCount += 1
}

const unlockBodyScroll = () => {
  if (!canUseDom() || activeLockCount === 0) {
    return
  }

  activeLockCount -= 1

  if (activeLockCount > 0) {
    return
  }

  const { body, documentElement } = document
  const bodyStyle = body.style
  const documentStyle = documentElement.style
  const scrollY = lockedScrollY

  if (savedBodyStyles) {
    bodyStyle.overflow = savedBodyStyles.overflow
    bodyStyle.position = savedBodyStyles.position
    bodyStyle.top = savedBodyStyles.top
    bodyStyle.width = savedBodyStyles.width
    bodyStyle.paddingRight = savedBodyStyles.paddingRight
    bodyStyle.overscrollBehavior = savedBodyStyles.overscrollBehavior
  }

  if (savedDocumentStyles) {
    documentStyle.overscrollBehavior = savedDocumentStyles.overscrollBehavior
  }

  savedBodyStyles = null
  savedDocumentStyles = null
  lockedScrollY = 0
  window.scrollTo(0, scrollY)
}

export function useBodyScrollLock(isLocked) {
  let isLockedByInstance = false

  const stopWatching = watch(
    isLocked,
    (shouldLock) => {
      if (shouldLock && !isLockedByInstance) {
        lockBodyScroll()
        isLockedByInstance = true
        return
      }

      if (!shouldLock && isLockedByInstance) {
        unlockBodyScroll()
        isLockedByInstance = false
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    stopWatching()

    if (isLockedByInstance) {
      unlockBodyScroll()
      isLockedByInstance = false
    }
  })
}
