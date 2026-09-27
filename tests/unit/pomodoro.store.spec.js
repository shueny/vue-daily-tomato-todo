import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  usePomodoroStore, DURATION_KEY, MODE_KEY, SESSION_KEY, FOCUS_RANGE, BREAK_RANGE
} from '@/stores/pomodoro'
import { useTodoStore, STORAGE_KEY } from '@/stores/todo'

function fresh () {
  setActivePinia(createPinia())
  return usePomodoroStore()
}

describe('pomodoro store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T09:00:00'))
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1, title: 'task', date: '2030-01-01', order: 0 }]))
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('durations', () => {
    it('defaults to 25 / 5', () => {
      const p = fresh()
      expect([p.focusMinutes, p.breakMinutes]).toEqual([25, 5])
    })

    it('migrates the old 50/10 mode', () => {
      localStorage.setItem(MODE_KEY, '50/10')
      const p = fresh()
      expect([p.focusMinutes, p.breakMinutes]).toEqual([50, 10])
    })

    it('prefers saved durations over the old mode and clamps them', () => {
      localStorage.setItem(MODE_KEY, '50/10')
      localStorage.setItem(DURATION_KEY, JSON.stringify({ focus: 999, break: 99 }))
      const p = fresh()
      expect([p.focusMinutes, p.breakMinutes]).toEqual([FOCUS_RANGE.max, BREAK_RANGE.max])
    })

    it('ignores corrupted saved durations', () => {
      localStorage.setItem(DURATION_KEY, '{oops')
      expect(fresh().focusMinutes).toBe(25)
    })

    it.each([
      [3, FOCUS_RANGE.min],
      [61, FOCUS_RANGE.max],
      [32.6, 33],
      ['40', 40],
      [NaN, FOCUS_RANGE.min]
    ])('setFocusMinutes(%s) stores %s', (input, expected) => {
      const p = fresh()
      p.setFocusMinutes(input)
      expect(p.focusMinutes).toBe(expected)
      expect(JSON.parse(localStorage.getItem(DURATION_KEY)).focus).toBe(expected)
    })

    it('clamps the break length', () => {
      const p = fresh()
      p.setBreakMinutes(0)
      expect(p.breakMinutes).toBe(BREAK_RANGE.min)
      p.setBreakMinutes(100)
      expect(p.breakMinutes).toBe(BREAK_RANGE.max)
    })
  })

  describe('running a session', () => {
    it('counts down the custom focus length, awards a tomato, then runs the custom break', () => {
      const p = fresh()
      p.setFocusMinutes(10)
      p.setBreakMinutes(2)
      p.startFocus(1)
      expect(p.phaseTotal).toBe(600)
      expect(p.displayTime).toBe('10:00')

      vi.advanceTimersByTime(600 * 1000)
      expect(p.phase).toBe('break')
      expect(p.phaseTotal).toBe(120)
      expect(useTodoStore().todos[0].tomatoes).toBe(1)

      vi.advanceTimersByTime(120 * 1000)
      expect(p.phase).toBe('idle')
      expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    })

    it('does not change the running phase when settings change mid-session', () => {
      const p = fresh()
      p.startFocus(1)
      vi.advanceTimersByTime(60 * 1000)
      p.setFocusMinutes(60)
      vi.advanceTimersByTime(1000)
      expect(p.phaseTotal).toBe(25 * 60)
      expect(p.secondsLeft).toBe(25 * 60 - 61)
    })

    it('pause freezes the countdown and resume continues it', () => {
      const p = fresh()
      p.startFocus(1)
      vi.advanceTimersByTime(10 * 1000)
      p.togglePause()
      vi.advanceTimersByTime(60 * 1000)
      expect(p.secondsLeft).toBe(25 * 60 - 10)
      p.togglePause()
      vi.advanceTimersByTime(5 * 1000)
      expect(p.secondsLeft).toBe(25 * 60 - 15)
    })

    it('starting twice in a row keeps a single ticking interval', () => {
      const p = fresh()
      p.startFocus(1)
      p.startFocus(1)
      expect(vi.getTimerCount()).toBe(1)
    })

    it('pause and resume are no-ops when idle', () => {
      const p = fresh()
      p.pause()
      p.resume()
      expect(p.phase).toBe('idle')
      expect(p.paused).toBe(false)
    })
  })

  describe('restoring after a reload', () => {
    it('restores a running session with its own length', () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        phase: 'focus', phaseSeconds: 900, endsAt: Date.now() + 300 * 1000, paused: false, activeTodoId: 1
      }))
      const p = fresh()
      p.restoreSession()
      expect(p.phaseTotal).toBe(900)
      expect(p.secondsLeft).toBe(300)
    })

    it('fills in the length for an old session without phaseSeconds', () => {
      localStorage.setItem(DURATION_KEY, JSON.stringify({ focus: 40, break: 8 }))
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        phase: 'break', endsAt: Date.now() + 60 * 1000, paused: false, activeTodoId: 1
      }))
      const p = fresh()
      p.restoreSession()
      expect(p.phaseTotal).toBe(8 * 60)
    })

    it('restores a paused session without ticking and caps its remaining time', () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        phase: 'focus', phaseSeconds: 600, paused: true, secondsLeft: 99999, activeTodoId: 1
      }))
      const p = fresh()
      p.restoreSession()
      expect(p.paused).toBe(true)
      expect(p.secondsLeft).toBe(600)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('awards the tomato and stops when both focus and break ended while away', () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        phase: 'focus', phaseSeconds: 600, endsAt: Date.now() - 3600 * 1000, paused: false, activeTodoId: 1
      }))
      const p = fresh()
      p.restoreSession()
      expect(p.phase).toBe('idle')
      expect(useTodoStore().todos[0].tomatoes).toBe(1)
    })

    it.each([
      ['corrupted JSON', '{bad'],
      ['unknown phase', JSON.stringify({ phase: 'nap' })],
      ['missing endsAt', JSON.stringify({ phase: 'focus', paused: false })]
    ])('ignores a %s session', (_, raw) => {
      localStorage.setItem(SESSION_KEY, raw)
      const p = fresh()
      p.restoreSession()
      expect(p.phase).toBe('idle')
      expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    })
  })
})
