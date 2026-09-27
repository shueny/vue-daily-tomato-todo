import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import DurationSheet from '@/components/DurationSheet.vue'
import { useUiStore } from '@/stores/ui'
import { usePomodoroStore, DURATION_KEY } from '@/stores/pomodoro'

let wrapper
function open () {
  const pinia = createPinia()
  setActivePinia(pinia)
  wrapper = mount(DurationSheet, { global: { plugins: [pinia], stubs: { transition: false } }, attachTo: document.body })
  const ui = useUiStore()
  ui.durationOpen = true
  return { ui, pomodoro: usePomodoroStore() }
}
const steps = () => wrapper.findAll('.ds-step')
const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

describe('DurationSheet', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => wrapper?.unmount())

  it('renders nothing until opened', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    wrapper = mount(DurationSheet, { global: { plugins: [pinia] } })
    expect(wrapper.find('.ds-panel').exists()).toBe(false)
  })

  it('shows the current durations and moves focus to the dial', async () => {
    const { pomodoro } = open()
    pomodoro.setFocusMinutes(40)
    await nextTick()
    await nextTick()
    expect(wrapper.find('.ds-value').text()).toBe('40分')
    expect(document.activeElement.classList.contains('retro-dial')).toBe(true)
  })

  it('− / + change focus and break by one minute and persist', async () => {
    const { pomodoro } = open()
    await nextTick()
    const [focusMinus, focusPlus, breakMinus, breakPlus] = steps()
    await focusPlus.trigger('click')
    await focusPlus.trigger('click')
    await focusMinus.trigger('click')
    await breakPlus.trigger('click')
    await breakMinus.trigger('click')
    await breakMinus.trigger('click')
    expect([pomodoro.focusMinutes, pomodoro.breakMinutes]).toEqual([26, 4])
    expect(JSON.parse(localStorage.getItem(DURATION_KEY))).toEqual({ focus: 26, break: 4 })
  })

  it('disables the steppers at the limits so rapid clicks cannot overshoot', async () => {
    const { pomodoro } = open()
    pomodoro.setFocusMinutes(60)
    pomodoro.setBreakMinutes(1)
    await nextTick()
    const [focusMinus, focusPlus, breakMinus] = steps()
    expect(focusPlus.attributes('disabled')).toBeDefined()
    expect(breakMinus.attributes('disabled')).toBeDefined()
    for (let i = 0; i < 5; i++) await focusPlus.trigger('click')
    expect(pomodoro.focusMinutes).toBe(60)
    expect(focusMinus.attributes('disabled')).toBeUndefined()
  })

  it('presets set the focus length and show which one is active', async () => {
    const { pomodoro } = open()
    await nextTick()
    const preset45 = wrapper.findAll('.ds-preset').find((b) => b.text() === '45 分')
    await preset45.trigger('click')
    expect(pomodoro.focusMinutes).toBe(45)
    expect(preset45.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('.ds-preset.active')).toHaveLength(1)
  })

  it('dragging/keys on the dial update the store', async () => {
    const { pomodoro } = open()
    await nextTick()
    await wrapper.find('.retro-dial').trigger('keydown', { key: 'PageUp' })
    expect(pomodoro.focusMinutes).toBe(30)
  })

  it.each([
    ['the close button', () => wrapper.find('.ds-close').trigger('click')],
    ['the done button', () => wrapper.find('.ds-done').trigger('click')],
    ['the backdrop', () => wrapper.find('.duration-sheet').trigger('click')],
    ['Escape', () => escape()]
  ])('closes with %s', async (_, act) => {
    const { ui } = open()
    await nextTick()
    await act()
    expect(ui.durationOpen).toBe(false)
  })

  it('does not close when clicking inside the panel', async () => {
    const { ui } = open()
    await nextTick()
    await wrapper.find('.ds-panel').trigger('click')
    expect(ui.durationOpen).toBe(true)
  })

  it('stops listening for Escape after closing', async () => {
    const { ui } = open()
    await nextTick()
    ui.durationOpen = false
    await nextTick()
    ui.durationOpen = false // 已關閉;再按 Esc 不應該有任何作用
    let changed = false
    ui.$subscribe(() => { changed = true })
    escape()
    await nextTick()
    expect(changed).toBe(false)
  })
})
