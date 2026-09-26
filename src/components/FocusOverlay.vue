<template>
  <transition name="fo-fade">
  <div
    class="focus-overlay"
    v-if="isRunning"
    :class="['is-' + phase, { 'is-paused': paused }]"
    role="dialog"
    aria-label="專注中"
  >
    <div class="fo-phase">{{ phase === 'focus' ? '🍅 專注時間' : '☕ 休息一下' }}</div>

    <div class="fo-tomato">
      <TomatoBuddy
        :size="260"
        :level="remaining"
        :mood="mood"
        :color="phase === 'break' ? 'mint' : 'red'"
        :label="displayTime"
        bounce
      />
      <transition name="fo-pop">
        <div class="fo-celebrate" v-if="celebrate">+1 🍅</div>
      </transition>
    </div>

    <div class="fo-task" v-if="activeTodo">{{ activeTodo.title }}</div>
    <div class="fo-basket" v-if="activeTodo && activeTodo.tomatoes" :aria-label="`已完成 ${activeTodo.tomatoes} 顆蕃茄`">
      <span v-for="n in Math.min(activeTodo.tomatoes, 8)" :key="n">🍅</span>
      <b v-if="activeTodo.tomatoes > 8">+{{ activeTodo.tomatoes - 8 }}</b>
    </div>
    <div class="fo-paused" :class="{ show: paused }">蕃茄睡著了… 按 ▶ 叫醒它</div>

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
  </transition>
</template>

<script>
import { mapState } from 'pinia'
import { usePomodoroStore } from '@/stores/pomodoro'
import TomatoBuddy from '@/components/TomatoBuddy.vue'

export default {
  name: 'FocusOverlay',
  components: { TomatoBuddy },
  setup () {
    const pomodoroStore = usePomodoroStore()
    return { pomodoroStore }
  },
  data () {
    return { celebrate: false }
  },
  computed: {
    ...mapState(usePomodoroStore, ['phase', 'isRunning', 'displayTime', 'activeTodo', 'paused', 'phaseTotal', 'secondsLeft']),
    // 剩餘比例 → 蕃茄裡的果汁高度
    remaining () {
      if (!this.phaseTotal) return 1
      return this.secondsLeft / this.phaseTotal
    },
    mood () {
      if (this.paused) return 'paused'
      if (this.celebrate) return 'cheer'
      if (this.phase === 'break') return 'sleep'
      if (this.secondsLeft <= 60) return 'sweat'
      return 'happy'
    }
  },
  watch: {
    // 專注結束進入休息:蕃茄歡呼一下
    phase (nv, ov) {
      if (ov === 'focus' && nv === 'break') {
        this.celebrate = true
        clearTimeout(this._celebrateTimer)
        this._celebrateTimer = setTimeout(() => {
          this.celebrate = false
        }, 2600)
      }
    }
  },
  beforeUnmount () {
    clearTimeout(this._celebrateTimer)
  }
}
</script>
