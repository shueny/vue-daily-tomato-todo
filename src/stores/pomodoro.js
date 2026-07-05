import { defineStore } from 'pinia'
import { useTodoStore } from './todo'

export const MODE_KEY = 'pomodoro-mode'

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
    secondsLeft: 0,
    activeTodoId: null,
    timerId: null
  }),
  getters: {
    isRunning: (state) => state.phase !== 'idle',
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
      }
    },
    startFocus (todoId) {
      this.stop()
      this.activeTodoId = todoId
      this.phase = 'focus'
      this.secondsLeft = MODES[this.mode].focus
      this.requestNotifyPermission()
      this.timerId = setInterval(() => this.tick(), 1000)
    },
    stop () {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      this.timerId = null
      this.phase = 'idle'
      this.secondsLeft = 0
      this.activeTodoId = null
    },
    tick () {
      this.secondsLeft -= 1
      if (this.secondsLeft > 0) return
      if (this.phase === 'focus') {
        // 完成一顆蕃茄,自動進入休息
        useTodoStore().addTomato(this.activeTodoId)
        this.notify('🍅 專注結束,休息一下!')
        this.phase = 'break'
        this.secondsLeft = MODES[this.mode].break
      } else {
        this.notify('休息結束,繼續加油!')
        this.stop()
      }
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
