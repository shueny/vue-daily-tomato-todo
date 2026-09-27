<template>
  <transition name="fo-fade">
    <div class="duration-sheet" v-if="ui.durationOpen" @click.self="close">
      <div class="ds-panel" role="dialog" aria-modal="true" aria-labelledby="dsTitle">
        <div class="ds-head">
          <h2 class="ds-title" id="dsTitle">設定時間</h2>
          <button type="button" class="ds-close" aria-label="關閉" @click="close">✕</button>
        </div>

        <div class="ds-clock">
          <RetroDial
            ref="dial"
            :size="236"
            :scale="60"
            :value="focus"
            :min="FOCUS_RANGE.min"
            :max="FOCUS_RANGE.max"
            :color="ui.isRetro ? '#B8432C' : '#FF6B5B'"
            label="專注時間"
            adjustable
            @update:value="pomodoro.setFocusMinutes"
          />
        </div>
        <p class="ds-hint">拖動錶盤上的圓點,或用下方按鈕調整</p>

        <div class="ds-row">
          <span class="ds-label">專注</span>
          <button type="button" class="ds-step" aria-label="專注少 1 分鐘"
            :disabled="focus <= FOCUS_RANGE.min" @click="pomodoro.setFocusMinutes(focus - 1)">−</button>
          <span class="ds-value" aria-live="polite">{{ focus }}<small>分</small></span>
          <button type="button" class="ds-step" aria-label="專注多 1 分鐘"
            :disabled="focus >= FOCUS_RANGE.max" @click="pomodoro.setFocusMinutes(focus + 1)">+</button>
          <span class="ds-range">{{ FOCUS_RANGE.min }}–{{ FOCUS_RANGE.max }}</span>
        </div>
        <div class="ds-presets" role="group" aria-label="常用長度">
          <button
            v-for="m in FOCUS_PRESETS"
            :key="m"
            type="button"
            class="ds-preset"
            :class="{ active: focus === m }"
            :aria-pressed="focus === m"
            @click="pomodoro.setFocusMinutes(m)"
          >
            {{ m }} 分
          </button>
        </div>

        <div class="ds-row ds-row--break">
          <span class="ds-label">休息</span>
          <button type="button" class="ds-step" aria-label="休息少 1 分鐘"
            :disabled="brk <= BREAK_RANGE.min" @click="pomodoro.setBreakMinutes(brk - 1)">−</button>
          <span class="ds-value ds-value--break" aria-live="polite">{{ brk }}<small>分</small></span>
          <button type="button" class="ds-step" aria-label="休息多 1 分鐘"
            :disabled="brk >= BREAK_RANGE.max" @click="pomodoro.setBreakMinutes(brk + 1)">+</button>
          <span class="ds-range">{{ BREAK_RANGE.min }}–{{ BREAK_RANGE.max }}</span>
        </div>

        <button type="button" class="ds-done" @click="close">完成</button>
        <p class="ds-note">下一顆蕃茄開始套用;按任務的 ▶ 開始專注</p>
      </div>
    </div>
  </transition>
</template>

<script>
import RetroDial from '@/components/RetroDial.vue'
import { usePomodoroStore, FOCUS_RANGE, BREAK_RANGE, FOCUS_PRESETS } from '@/stores/pomodoro'
import { useUiStore } from '@/stores/ui'

export default {
  name: 'DurationSheet',
  components: { RetroDial },
  setup () {
    return {
      ui: useUiStore(),
      pomodoro: usePomodoroStore(),
      FOCUS_RANGE,
      BREAK_RANGE,
      FOCUS_PRESETS
    }
  },
  computed: {
    focus () {
      return this.pomodoro.focusMinutes
    },
    brk () {
      return this.pomodoro.breakMinutes
    }
  },
  watch: {
    'ui.durationOpen' (open) {
      if (open) {
        document.addEventListener('keydown', this.onKey)
        this._returnFocus = document.activeElement
        this.$nextTick(() => this.$refs.dial?.$el?.focus())
      } else {
        document.removeEventListener('keydown', this.onKey)
        this._returnFocus?.focus?.()
      }
    }
  },
  beforeUnmount () {
    document.removeEventListener('keydown', this.onKey)
  },
  methods: {
    onKey (e) {
      if (e.key === 'Escape') this.close()
    },
    close () {
      this.ui.durationOpen = false
    }
  }
}
</script>
