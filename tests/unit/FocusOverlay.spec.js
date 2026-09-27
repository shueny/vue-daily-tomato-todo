import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import FocusOverlay from '@/components/FocusOverlay.vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { useUiStore } from '@/stores/ui'
import { useTodoStore, STORAGE_KEY } from '@/stores/todo'

function setup (theme) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useUiStore().setTheme(theme)
  const wrapper = mount(FocusOverlay, { global: { plugins: [pinia], stubs: { transition: false } } })
  return { wrapper, pomodoro: usePomodoroStore() }
}

describe('FocusOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1, title: '寫週報', date: '2030-01-01', order: 0, tomatoes: 2 }]))
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('is hidden while idle', () => {
    const { wrapper } = setup('retro')
    expect(wrapper.find('.focus-overlay').exists()).toBe(false)
  })

  describe('retro theme', () => {
    it('shows the round timer with the custom focus length', async () => {
      const { wrapper, pomodoro } = setup('retro')
      pomodoro.setFocusMinutes(15)
      pomodoro.startFocus(1)
      await nextTick()
      expect(wrapper.find('.focus-overlay--retro').exists()).toBe(true)
      expect(wrapper.find('.fr-time').text()).toBe('15:00')
      expect(wrapper.find('.fr-len').text()).toBe('專注 15 分')
      expect(wrapper.find('.rd-hub-title').text()).toBe('寫週報')
      expect(wrapper.findAll('.fr-dot')).toHaveLength(2)
      // 60 分錶盤上 15 分 = 四分之一圈
      expect(wrapper.find('.rd-sector').attributes('d')).toContain('254 150')
    })

    it('the orange knob pauses and resumes', async () => {
      const { wrapper, pomodoro } = setup('retro')
      pomodoro.startFocus(1)
      await nextTick()
      const knob = wrapper.find('.fr-knob')
      expect(knob.attributes('aria-label')).toBe('暫停')
      await knob.trigger('click')
      expect(pomodoro.paused).toBe(true)
      expect(knob.attributes('aria-label')).toBe('繼續')
      expect(wrapper.find('.fr-sub').text()).toContain('已暫停')
      await knob.trigger('click')
      expect(pomodoro.paused).toBe(false)
    })

    it('switches to the 15-minute green dial on break and can skip it', async () => {
      const { wrapper, pomodoro } = setup('retro')
      pomodoro.setFocusMinutes(5)
      pomodoro.setBreakMinutes(3)
      pomodoro.startFocus(1)
      await nextTick() // 先讓畫面看到「專注中」
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick() // phase watcher 觸發 celebrate
      await nextTick() // 重新渲染
      expect(wrapper.find('.fr-phase').text()).toContain('休息中')
      expect(wrapper.find('.rd-sector').attributes('fill')).toBe('#2E6A4E')
      expect(wrapper.findAll('.rd-num').map((n) => n.text())).toEqual(['0', '3', '6', '9', '12'])
      expect(wrapper.find('.fr-celebrate').exists()).toBe(true)
      await wrapper.find('.fr-stop').trigger('click')
      expect(pomodoro.phase).toBe('idle')
    })

    it('does not crash when the focused task was deleted', async () => {
      const { wrapper, pomodoro } = setup('retro')
      pomodoro.startFocus(1)
      useTodoStore().todos.splice(0, 1)
      await nextTick()
      expect(wrapper.find('.fr-sub').text()).toBe('剩餘時間')
      expect(wrapper.find('.rd-hub-title').text()).toBe('')
    })
  })

  describe('cute theme', () => {
    it('shows the big tomato whose juice level follows the remaining time', async () => {
      const { wrapper, pomodoro } = setup('cute')
      pomodoro.setFocusMinutes(10)
      pomodoro.startFocus(1)
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()
      expect(wrapper.find('.focus-overlay--retro').exists()).toBe(false)
      expect(wrapper.find('.tb-label').text()).toBe('05:00')
      expect(wrapper.vm.remaining).toBeCloseTo(0.5)
    })

    it.each([
      ['paused', (p) => p.pause(), 'paused'],
      ['last minute', (p) => vi.advanceTimersByTime((25 * 60 - 30) * 1000), 'sweat'],
      ['running', () => {}, 'happy']
    ])('mood is right when %s', async (_, act, mood) => {
      const { wrapper, pomodoro } = setup('cute')
      pomodoro.startFocus(1)
      act(pomodoro)
      await nextTick()
      expect(wrapper.vm.mood).toBe(mood)
    })
  })
})
