<template>
  <div class="focus-overlay" v-if="isRunning" :class="'is-' + phase" role="dialog" aria-label="專注中">
    <div class="fo-phase">{{ phase === 'focus' ? '🍅 FOCUS' : '☕ BREAK' }}</div>
    <div class="fo-ringwrap">
      <svg width="210" height="210" viewBox="0 0 210 210" aria-hidden="true">
        <circle class="fo-ring-bg" cx="105" cy="105" r="96" fill="none" stroke-width="7" />
        <circle
          class="fo-ring-fg"
          cx="105" cy="105" r="96" fill="none" stroke-width="7" stroke-linecap="round"
          :stroke-dasharray="CIRC"
          :stroke-dashoffset="ringOffset"
        />
      </svg>
      <div class="fo-time">{{ displayTime }}</div>
    </div>
    <div class="fo-task" v-if="activeTodo">{{ activeTodo.title }}</div>
    <div class="fo-paused" :class="{ show: paused }">已暫停</div>
    <div class="fo-ctrl">
      <button class="fo-toggle" type="button" :aria-label="paused ? '繼續' : '暫停'"
        @click="pomodoroStore.togglePause()">
        {{ paused ? '▶' : '⏸' }}
      </button>
      <button class="fo-stop" type="button" :aria-label="phase === 'break' ? '跳過休息' : '停止'"
        @click="pomodoroStore.stop()">■</button>
    </div>
    <div class="fo-hint">{{ phase === 'break' ? '■ 跳過休息' : '■ 放棄這顆蕃茄' }}</div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePomodoroStore } from '@/stores/pomodoro'

const CIRC = 2 * Math.PI * 96

export default {
  name: 'FocusOverlay',
  setup () {
    const pomodoroStore = usePomodoroStore()
    return { pomodoroStore, CIRC }
  },
  computed: {
    ...mapState(usePomodoroStore, ['phase', 'isRunning', 'displayTime', 'activeTodo', 'paused', 'phaseTotal', 'secondsLeft']),
    ringOffset () {
      if (!this.phaseTotal) return 0
      return CIRC * (1 - this.secondsLeft / this.phaseTotal)
    }
  }
}
</script>
