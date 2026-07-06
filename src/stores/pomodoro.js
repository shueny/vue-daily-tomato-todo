import { defineStore } from 'pinia'
import { useTodoStore } from './todo'

export const MODE_KEY = 'pomodoro-mode'
export const SESSION_KEY = 'pomodoro-session'

// 兩種模式:專注/休息(秒)
export const MODES = {
  '25/5': { focus: 25 * 60, break: 5 * 60 },
  '50/10': { focus: 50 * 60, break: 10 * 60 }
}

function loadMode () {
  const saved = localStorage.getItem(MODE_KEY)
  return MODES[saved] ? saved : '25/5'
}

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => ({
    mode: loadMode(), // '25/5' | '50/10'
    phase: 'idle', // 'idle' | 'focus' | 'break'
    endsAt: null, // 目前階段的結束時間戳(ms);倒數以此為準
    secondsLeft: 0,
    paused: false,
    activeTodoId: null,
    timerId: null
  }),
  getters: {
    isRunning: (state) => state.phase !== 'idle',
    phaseTotal: (state) => (state.phase === 'idle' ? 0 : MODES[state.mode][state.phase]),
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
    setMode (mode) {
      if (!MODES[mode]) return
      this.mode = mode
      localStorage.setItem(MODE_KEY, mode)
      // 進行中切換模式:目前階段以新時長重新開始
      if (this.phase !== 'idle') {
        this.secondsLeft = MODES[mode][this.phase]
        this.endsAt = Date.now() + this.secondsLeft * 1000
        this.saveSession()
      }
    },
    startFocus (todoId) {
      this.stop()
      this.activeTodoId = todoId
      this.phase = 'focus'
      this.endsAt = Date.now() + MODES[this.mode].focus * 1000
      this.secondsLeft = MODES[this.mode].focus
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
        this.endsAt += MODES[this.mode].break * 1000
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
      if (session.paused) {
        // 暫停中:凍結的剩餘秒數原樣還原,保持暫停
        this.paused = true
        this.secondsLeft = session.secondsLeft || MODES[this.mode][this.phase]
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
