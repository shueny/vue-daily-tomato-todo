import { defineStore } from 'pinia'
import { useTodoStore } from './todo'

export const MODE_KEY = 'pomodoro-mode' // 舊版:'25/5' | '50/10',只用來遷移
export const DURATION_KEY = 'pomodoro-durations'
export const SESSION_KEY = 'pomodoro-session'

// 可調範圍(分鐘)
export const FOCUS_RANGE = { min: 5, max: 60 }
export const BREAK_RANGE = { min: 1, max: 15 }
export const FOCUS_PRESETS = [15, 25, 45, 60]

const LEGACY_MODES = {
  '25/5': { focus: 25, break: 5 },
  '50/10': { focus: 50, break: 10 }
}

function clamp (v, range) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return range.min
  return Math.max(range.min, Math.min(range.max, n))
}

function loadDurations () {
  try {
    const saved = JSON.parse(localStorage.getItem(DURATION_KEY))
    if (saved && saved.focus && saved.break) {
      return { focus: clamp(saved.focus, FOCUS_RANGE), break: clamp(saved.break, BREAK_RANGE) }
    }
  } catch (e) {
    // 壞掉的資料直接忽略
  }
  // 遷移:沿用舊版選過的模式
  return { ...(LEGACY_MODES[localStorage.getItem(MODE_KEY)] || LEGACY_MODES['25/5']) }
}

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => {
    const d = loadDurations()
    return {
      focusMinutes: d.focus,
      breakMinutes: d.break,
      phase: 'idle', // 'idle' | 'focus' | 'break'
      phaseSeconds: 0, // 目前階段開始時的總長(秒);中途改設定不影響進行中的階段
      endsAt: null, // 目前階段的結束時間戳(ms);倒數以此為準
      secondsLeft: 0,
      paused: false,
      activeTodoId: null,
      timerId: null
    }
  },
  getters: {
    isRunning: (state) => state.phase !== 'idle',
    phaseTotal: (state) => (state.phase === 'idle' ? 0 : state.phaseSeconds),
    displayTime: (state) => {
      const m = String(Math.floor(state.secondsLeft / 60)).padStart(2, '0')
      const s = String(state.secondsLeft % 60).padStart(2, '0')
      return `${m}:${s}`
    },
    activeTodo (state) {
      const todoStore = useTodoStore()
      return todoStore.todos.find((todo) => todo.id === state.activeTodoId) || null
    }
  },
  actions: {
    lengthOf (phase) {
      return (phase === 'break' ? this.breakMinutes : this.focusMinutes) * 60
    },
    setFocusMinutes (min) {
      this.focusMinutes = clamp(min, FOCUS_RANGE)
      this.saveDurations()
    },
    setBreakMinutes (min) {
      this.breakMinutes = clamp(min, BREAK_RANGE)
      this.saveDurations()
    },
    saveDurations () {
      localStorage.setItem(DURATION_KEY, JSON.stringify({ focus: this.focusMinutes, break: this.breakMinutes }))
    },
    startFocus (todoId) {
      this.stop()
      this.activeTodoId = todoId
      this.phase = 'focus'
      this.phaseSeconds = this.lengthOf('focus')
      this.endsAt = Date.now() + this.phaseSeconds * 1000
      this.secondsLeft = this.phaseSeconds
      this.saveSession()
      this.requestNotifyPermission()
      this.timerId = setInterval(() => this.tick(), 1000)
    },
    pause () {
      if (this.phase === 'idle' || this.paused) return
      if (this.timerId) clearInterval(this.timerId)
      this.timerId = null
      this.paused = true
      this.saveSession()
    },
    resume () {
      if (this.phase === 'idle' || !this.paused) return
      this.paused = false
      this.endsAt = Date.now() + this.secondsLeft * 1000
      this.saveSession()
      this.timerId = setInterval(() => this.tick(), 1000)
    },
    togglePause () {
      if (this.paused) this.resume()
      else this.pause()
    },
    stop () {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      this.timerId = null
      this.phase = 'idle'
      this.phaseSeconds = 0
      this.endsAt = null
      this.secondsLeft = 0
      this.paused = false
      this.activeTodoId = null
      localStorage.removeItem(SESSION_KEY)
    },
    tick () {
      this.secondsLeft = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000))
      if (this.secondsLeft > 0) return
      if (this.phase === 'focus') {
        // 完成一顆蕃茄,自動進入休息(休息從專注原定結束時間接續起算)
        useTodoStore().addTomato(this.activeTodoId)
        this.notify('🍅 專注結束,休息一下!')
        this.phase = 'break'
        this.phaseSeconds = this.lengthOf('break')
        this.endsAt += this.phaseSeconds * 1000
        if (this.endsAt <= Date.now()) {
          // 連休息時段都已經過完(例如長時間離開後回來)
          this.stop()
          return
        }
        this.secondsLeft = Math.ceil((this.endsAt - Date.now()) / 1000)
        this.saveSession()
      } else {
        this.notify('休息結束,繼續加油!')
        this.stop()
      }
    },
    saveSession () {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        phase: this.phase,
        phaseSeconds: this.phaseSeconds,
        endsAt: this.endsAt,
        paused: this.paused,
        secondsLeft: this.secondsLeft,
        activeTodoId: this.activeTodoId
      }))
    },
    // 頁面載入時呼叫:還原進行中的番茄,依時間戳換算剩餘秒數
    restoreSession () {
      let session = null
      try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY))
      } catch (e) {
        // 壞掉的資料直接忽略
      }
      if (!session || (session.phase !== 'focus' && session.phase !== 'break')) {
        localStorage.removeItem(SESSION_KEY)
        return
      }
      this.phase = session.phase
      this.activeTodoId = session.activeTodoId
      // 舊版 session 沒有 phaseSeconds:用目前設定補上
      this.phaseSeconds = session.phaseSeconds > 0 ? session.phaseSeconds : this.lengthOf(this.phase)
      if (session.paused) {
        // 暫停中:凍結的剩餘秒數原樣還原,保持暫停
        this.paused = true
        this.secondsLeft = Math.min(session.secondsLeft || this.phaseSeconds, this.phaseSeconds)
        this.endsAt = Date.now() + this.secondsLeft * 1000
        return
      }
      if (typeof session.endsAt !== 'number') {
        this.stop()
        return
      }
      this.endsAt = session.endsAt
      this.timerId = setInterval(() => this.tick(), 1000)
      // 立即校正一次:若離開期間階段已結束,tick 會補發蕃茄並轉換或收尾
      this.tick()
    },
    requestNotifyPermission () {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    },
    notify (message) {
      if ('Notification' in window && Notification.permission === 'granted') {
        // eslint-disable-next-line no-new
        new Notification('Todo List', { body: message })
      }
    }
  }
})
