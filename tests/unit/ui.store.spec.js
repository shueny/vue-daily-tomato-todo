import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore, THEME_KEY } from '@/stores/ui'

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to the cute theme', () => {
    const ui = useUiStore()
    expect(ui.theme).toBe('cute')
    expect(ui.isRetro).toBe(false)
  })

  it('switches to retro and remembers it', () => {
    useUiStore().setTheme('retro')
    expect(localStorage.getItem(THEME_KEY)).toBe('retro')
    setActivePinia(createPinia())
    expect(useUiStore().isRetro).toBe(true)
  })

  it('ignores unknown themes, including a tampered saved value', () => {
    const ui = useUiStore()
    ui.setTheme('neon')
    expect(ui.theme).toBe('cute')
    localStorage.setItem(THEME_KEY, 'neon')
    setActivePinia(createPinia())
    expect(useUiStore().theme).toBe('cute')
  })

  it('still works when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const ui = useUiStore()
    expect(ui.theme).toBe('cute')
    ui.setTheme('retro')
    expect(ui.theme).toBe('retro')
  })
})
