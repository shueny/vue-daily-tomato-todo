<template>
  <transition name="fo-fade">
  <div
    class="focus-overlay focus-overlay--retro"
    v-if="isRunning && ui.isRetro"
    :class="['is-' + phase, { 'is-paused': paused }]"
    role="dialog"
    :aria-label="phase === 'focus' ? '專注中' : '休息中'"
  >
    <div class="fr-top">
      <span class="fr-phase">{{ phase === 'focus' ? 'FOCUS · 專注中' : 'BREAK · 休息中' }}</span>
      <span class="fr-len">{{ phase === 'focus' ? '專注' : '休息' }} {{ Math.round(phaseTotal / 60) }} 分</span>
    </div>

    <div class="fr-body">
      <button type="button" class="fr-knob" :aria-label="paused ? '繼續' : '暫停'"
        @click="pomodoroStore.togglePause()">
        <span>
          <svg v-if="paused" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5l13 7.5-13 7.5z" /></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
        </span>
      </button>
      <RetroDial
        :size="276"
        :scale="phase === 'break' ? 15 : 60"
        :value="secondsLeft / 60"
        :color="phase === 'break' ? '#2E6A4E' : '#B8432C'"
        :title="phase === 'break' ? '休息一下' : (activeTodo ? activeTodo.title : '')"
      />
      <transition name="fo-pop">
        <div class="fr-celebrate" v-if="celebrate">+1 顆蕃茄</div>
      </transition>
    </div>

    <div class="fr-time" role="timer">{{ displayTime }}</div>
    <div class="fr-sub">
      {{ paused ? '已暫停 · 按上方旋鈕繼續' : (phase === 'break' ? '伸伸懶腰,喝口水' : '剩餘時間' + (activeTodo ? ' · ' + activeTodo.title : '')) }}
    </div>
    <div class="fr-dots" v-if="activeTodo && activeTodo.tomatoes" :aria-label="`已完成 ${activeTodo.tomatoes} 顆蕃茄`">
      <span v-for="n in Math.min(activeTodo.tomatoes, 8)" :key="n" class="fr-dot"></span>
      <span class="fr-dots-text">已完成 {{ activeTodo.tomatoes }} 顆</span>
    </div>

    <div class="fr-actions">
      <button type="button" class="fr-stop" @click="pomodoroStore.stop()">
        <svg v-if="phase === 'break'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 5.5l9 6.5-9 6.5z" /><rect x="16" y="5.5" width="3" height="13" rx="1" /></svg>
        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.5" /></svg>
        {{ phase === 'break' ? '跳過休息' : '放棄這顆蕃茄' }}
      </button>
      <span class="fr-hint">按上方橘色旋鈕{{ paused ? '繼續' : '暫停' }}</span>
    </div>
  </div>
  <div
    class="focus-overlay"
    v-else-if="isRunning"
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
import RetroDial from '@/components/RetroDial.vue'
import { useUiStore } from '@/stores/ui'

export default {
  name: 'FocusOverlay',
  components: { TomatoBuddy, RetroDial },
  setup () {
    const pomodoroStore = usePomodoroStore()
    return { pomodoroStore, ui: useUiStore() }
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
