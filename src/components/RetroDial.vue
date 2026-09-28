<template>
  <svg
    ref="svg"
    class="retro-dial"
    :class="{ adjustable, dragging }"
    viewBox="0 0 300 300"
    :width="size"
    :height="size"
    v-bind="sliderAttrs"
    @pointerdown="onDown"
    @keydown="onKey"
  >
    <circle class="rd-face" cx="150" cy="150" r="146" />
    <path v-if="sector" class="rd-sector" :d="sector" :fill="color" />

    <!-- 刻度:細刻度每一格、粗刻度每個數字 -->
    <circle
      class="rd-tick" cx="150" cy="150" r="137" stroke-width="6"
      :stroke-dasharray="minorDash" stroke-dashoffset="0.45" transform="rotate(-90 150 150)"
    />
    <circle
      class="rd-tick" cx="150" cy="150" r="135" stroke-width="10"
      :stroke-dasharray="majorDash" stroke-dashoffset="1.2" transform="rotate(-90 150 150)"
    />
    <text
      v-for="n in numbers" :key="n.label" class="rd-num"
      :x="n.x" :y="n.y" text-anchor="middle" dominant-baseline="central"
    >{{ n.label }}</text>

    <circle v-if="adjustable" class="rd-handle" :cx="handle.x" :cy="handle.y" r="8" />

    <circle class="rd-hub" cx="150" cy="150" r="40" />
    <template v-if="adjustable">
      <text class="rd-hub-big" x="150" y="145" text-anchor="middle" dominant-baseline="central">{{ Math.round(value) }}</text>
      <text class="rd-hub-small" x="150" y="170" text-anchor="middle" dominant-baseline="central">分鐘</text>
    </template>
    <template v-else>
      <g class="rd-logo" transform="translate(139 116) scale(0.92)" :stroke="color">
        <path d="M12 7c4.5-1.5 9 1 9 6s-4 8-9 8-9-3-9-8 4.5-7.5 9-6z" />
        <path d="M12 7l-3.5-2M12 7l3.5-2M12 7V3M12 7l-4.5 1.2M12 7l4.5 1.2" />
      </g>
      <text class="rd-hub-title" x="150" y="163" text-anchor="middle">{{ shortTitle }}</text>
    </template>
  </svg>
</template>

<script>
// 復古圓形計時器錶盤:扇形 = value 分鐘(錶盤滿格 = scale 分鐘)
// adjustable 時可以拖曳邊緣圓點或用方向鍵調整,發出 update:value
const R = 104

function polar (frac, r) {
  const a = frac * 2 * Math.PI
  return { x: +(150 + r * Math.sin(a)).toFixed(2), y: +(150 - r * Math.cos(a)).toFixed(2) }
}

export default {
  name: 'RetroDial',
  props: {
    value: { type: Number, default: 0 },
    scale: { type: Number, default: 60 },
    color: { type: String, default: '#B8432C' },
    size: { type: Number, default: 300 },
    title: { type: String, default: '' },
    adjustable: { type: Boolean, default: false },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 60 },
    label: { type: String, default: '時間' }
  },
  emits: ['update:value'],
  data () {
    return { dragging: false }
  },
  computed: {
    frac () {
      return Math.max(0, Math.min(1, this.value / this.scale))
    },
    sector () {
      const f = this.frac
      if (f <= 0) return ''
      if (f >= 0.999) {
        return `M150 ${150 - R} A${R} ${R} 0 1 1 150 ${150 + R} A${R} ${R} 0 1 1 150 ${150 - R} Z`
      }
      const p = polar(f, R)
      return `M150 150 L150 ${150 - R} A${R} ${R} 0 ${f > 0.5 ? 1 : 0} 1 ${p.x} ${p.y} Z`
    },
    handle () {
      return polar(this.frac, R)
    },
    labelCount () {
      return this.scale % 5 === 0 && this.scale >= 30 ? 12 : 5
    },
    numbers () {
      const step = this.scale / this.labelCount
      return Array.from({ length: this.labelCount }, (_, i) => ({
        label: String(Math.round(i * step)),
        ...polar(i / this.labelCount, 119)
      }))
    },
    minorDash () {
      const seg = (2 * Math.PI * 137) / this.scale
      return `0.9 ${(seg - 0.9).toFixed(3)}`
    },
    majorDash () {
      const seg = (2 * Math.PI * 135) / this.labelCount
      return `2.4 ${(seg - 2.4).toFixed(3)}`
    },
    shortTitle () {
      const t = this.title || ''
      return t.length > 6 ? t.slice(0, 6) + '…' : t
    },
    sliderAttrs () {
      if (!this.adjustable) return { 'aria-hidden': 'true' }
      return {
        role: 'slider',
        tabindex: 0,
        'aria-label': this.label,
        'aria-valuemin': this.min,
        'aria-valuemax': this.max,
        'aria-valuenow': Math.round(this.value),
        'aria-valuetext': `${Math.round(this.value)} 分鐘`
      }
    }
  },
  methods: {
    emit (v) {
      const next = Math.max(this.min, Math.min(this.max, Math.round(v)))
      if (next !== Math.round(this.value)) this.$emit('update:value', next)
    },
    valueAt (e) {
      const rect = this.$refs.svg.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      let a = Math.atan2(dx, -dy)
      if (a < 0) a += 2 * Math.PI
      let v = (a / (2 * Math.PI)) * this.scale
      // 越過 12 點方向時不要從最大跳到最小(或反過來)
      const q = this.scale / 4
      if (this.value > this.scale - q && v < q) v = this.max
      else if (this.value < q && v > this.scale - q) v = this.min
      return v
    },
    onDown (e) {
      if (!this.adjustable || (e.button !== undefined && e.button !== 0)) return
      e.preventDefault()
      this.$refs.svg.focus()
      this.dragging = true
      this.$refs.svg.setPointerCapture?.(e.pointerId)
      this.emit(this.valueAt(e))
      this.$refs.svg.addEventListener('pointermove', this.onMove)
      this.$refs.svg.addEventListener('pointerup', this.onUp)
      this.$refs.svg.addEventListener('pointercancel', this.onUp)
    },
    onMove (e) {
      if (this.dragging) this.emit(this.valueAt(e))
    },
    onUp () {
      this.dragging = false
      const svg = this.$refs.svg
      if (!svg) return
      svg.removeEventListener('pointermove', this.onMove)
      svg.removeEventListener('pointerup', this.onUp)
      svg.removeEventListener('pointercancel', this.onUp)
    },
    onKey (e) {
      if (!this.adjustable) return
      const steps = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }
      if (e.key in steps) {
        e.preventDefault()
        this.emit(Math.round(this.value) + steps[e.key])
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        this.emit(e.key === 'Home' ? this.min : this.max)
      }
    }
  },
  beforeUnmount () {
    this.onUp()
  }
}
</script>

<style lang="scss">
.retro-dial {
  display: block;
  overflow: visible;
  outline: 0;
  touch-action: none;

  .rd-face {
    fill: #fdfcf8;
    stroke: #e4ded3;
    stroke-width: 1.5;
  }
  .rd-sector {
    transition: fill 0.3s;
  }
  .rd-tick {
    fill: none;
    stroke: #2b2a27;
  }
  .rd-num {
    font-family: "DM Sans", "Noto Sans TC", sans-serif;
    font-size: 12px;
    fill: #2b2a27;
  }
  .rd-hub {
    fill: #f8f5ef;
    stroke: #e4ded3;
    stroke-width: 1.5;
  }
  .rd-logo {
    fill: none;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .rd-hub-title {
    font-family: "DM Sans", "Noto Sans TC", sans-serif;
    font-size: 11px;
    fill: #2b2a27;
  }
  .rd-hub-big {
    font-family: "DM Sans", sans-serif;
    font-size: 26px;
    font-weight: 300;
    fill: #2b2a27;
  }
  .rd-hub-small {
    font-size: 10px;
    letter-spacing: 2px;
    fill: #6b665d;
  }
  .rd-handle {
    fill: #fdfcf8;
    stroke: #2b2a27;
    stroke-width: 2;
    transition: r 0.15s;
  }
  &.adjustable {
    cursor: grab;
  }
  &.dragging {
    cursor: grabbing;
    .rd-handle {
      r: 11;
    }
  }
  &:focus-visible .rd-handle {
    stroke: #d9822b;
    stroke-width: 3;
  }
}
</style>
