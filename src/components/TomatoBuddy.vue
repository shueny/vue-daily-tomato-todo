<template>
  <svg
    class="tomato-buddy"
    :class="['mood-' + mood, { bounce }]"
    :width="size"
    :height="size"
    viewBox="0 0 200 200"
    aria-hidden="true"
  >
    <defs>
      <clipPath :id="clipId">
        <path :d="BODY" />
      </clipPath>
    </defs>

    <!-- 影子 -->
    <ellipse class="tb-shadow" cx="100" cy="192" rx="58" ry="6" />

    <!-- 身體:淡色底 + 會隨剩餘時間下降的「果汁」 -->
    <path :d="BODY" :fill="palette.pale" />
    <g :clip-path="`url(#${clipId})`">
      <g class="tb-level" :style="{ transform: `translateY(${levelY}px)` }">
        <path class="tb-wave tb-wave--back" :d="WAVE" :fill="palette.deep" />
        <path class="tb-wave" :d="WAVE" :fill="palette.main" />
      </g>
      <ellipse class="tb-shine" cx="62" cy="80" rx="16" ry="24" transform="rotate(28 62 80)" />
    </g>
    <path :d="BODY" fill="none" :stroke="palette.line" stroke-width="4" stroke-linejoin="round" />

    <!-- 蒂頭 -->
    <g class="tb-leaf">
      <path d="M100 34 q2 -16 12 -22" fill="none" stroke="#3E8E4F" stroke-width="5" stroke-linecap="round" />
      <path
        d="M100 50 L84 58 L88 46 L72 42 L88 38 L86 26 L100 34 L114 26 L112 38 L128 42 L112 46 L116 58 Z"
        fill="#5CBF6E"
        stroke="#3E8E4F"
        stroke-width="3.5"
        stroke-linejoin="round"
      />
    </g>

    <!-- 臉 -->
    <g class="tb-face">
      <ellipse class="tb-cheek" cx="60" cy="112" rx="11" ry="7" />
      <ellipse class="tb-cheek" cx="140" cy="112" rx="11" ry="7" />

      <template v-if="mood === 'sleep'">
        <path d="M70 98 q8 7 16 0 M114 98 q8 7 16 0" class="tb-stroke" />
        <ellipse cx="100" cy="116" rx="4" ry="5" fill="#4A2A1F" />
      </template>
      <template v-else-if="mood === 'cheer'">
        <path d="M70 101 q8 -10 16 0 M114 101 q8 -10 16 0" class="tb-stroke" />
        <path d="M89 110 q11 16 22 0 Z" fill="#4A2A1F" stroke="#4A2A1F" stroke-width="3" stroke-linejoin="round" />
      </template>
      <template v-else-if="mood === 'paused'">
        <path d="M70 99 h16 M114 99 h16" class="tb-stroke" />
        <path d="M93 115 h14" class="tb-stroke" />
      </template>
      <template v-else>
        <g class="tb-eyes">
          <ellipse cx="78" cy="98" rx="6.5" ry="8.5" fill="#4A2A1F" />
          <ellipse cx="122" cy="98" rx="6.5" ry="8.5" fill="#4A2A1F" />
          <circle cx="80.5" cy="94.5" r="2.4" fill="#fff" />
          <circle cx="124.5" cy="94.5" r="2.4" fill="#fff" />
        </g>
        <path v-if="mood === 'sweat'" d="M92 116 q8 -6 16 0" class="tb-stroke" />
        <path v-else d="M91 110 q9 10 18 0" class="tb-stroke" />
      </template>

      <path
        v-if="mood === 'sweat'"
        class="tb-sweat"
        d="M150 76 q7 10 0 14 q-7 -4 0 -14 Z"
        fill="#8FD3FF"
        stroke="#4A9FD8"
        stroke-width="2"
      />
    </g>

    <!-- 倒數文字 -->
    <text v-if="label" class="tb-label" x="100" y="160" text-anchor="middle">{{ label }}</text>

    <!-- 睡覺的 Zzz -->
    <g v-if="mood === 'sleep'" class="tb-zzz">
      <text x="150" y="58">z</text>
      <text x="166" y="40">Z</text>
    </g>
  </svg>
</template>

<script>
// 可愛蕃茄吉祥物:level(0~1)控制身體裡的「果汁」高度,拿來當倒數進度
const BODY =
  'M100 48 C122 34 184 52 186 114 C188 164 146 190 100 190 C54 190 12 164 14 114 C16 52 78 34 100 48 Z'

// 一段可以無縫平移的波浪(波長 50,往左移 100 剛好接回原樣)
function buildWave () {
  let d = 'M-100 0'
  for (let x = -100; x < 300; x += 50) d += ' q12.5 -7 25 0 t25 0'
  return d + ' L300 240 L-100 240 Z'
}
const WAVE = buildWave()

const PALETTES = {
  red: { main: '#FF6B5B', deep: '#F0503F', pale: '#FFE4DC', line: '#D2412F' },
  mint: { main: '#7ED69A', deep: '#5CC07B', pale: '#E3F7E8', line: '#3E9E5C' }
}

let uid = 0

export default {
  name: 'TomatoBuddy',
  props: {
    size: { type: Number, default: 80 },
    level: { type: Number, default: 1 },
    mood: { type: String, default: 'happy' }, // happy | sleep | cheer | paused | sweat
    color: { type: String, default: 'red' }, // red | mint
    label: { type: String, default: '' },
    bounce: { type: Boolean, default: false }
  },
  setup () {
    uid += 1
    return { BODY, WAVE, clipId: `tb-clip-${uid}` }
  },
  computed: {
    palette () {
      return PALETTES[this.color] || PALETTES.red
    },
    // 身體大約在 y=40~190,level=1 時波浪在頂端、0 時沉到底
    levelY () {
      const l = Math.min(1, Math.max(0, this.level))
      return 36 + (1 - l) * 158
    }
  }
}
</script>

<style lang="scss">
.tomato-buddy {
  overflow: visible;
  display: block;

  .tb-shadow {
    fill: rgba(120, 60, 40, 0.12);
  }
  .tb-level {
    transition: transform 1s linear;
  }
  .tb-wave {
    animation: tb-wave 2.4s linear infinite;
  }
  .tb-wave--back {
    animation-duration: 3.6s;
    animation-direction: reverse;
    opacity: 0.8;
  }
  .tb-shine {
    fill: #fff;
    opacity: 0.45;
  }
  .tb-leaf {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: tb-wiggle 3s ease-in-out infinite;
  }
  .tb-cheek {
    fill: #ff8fa0;
    opacity: 0.6;
  }
  .tb-stroke {
    fill: none;
    stroke: #4a2a1f;
    stroke-width: 4;
    stroke-linecap: round;
  }
  .tb-eyes {
    transform-box: fill-box;
    transform-origin: center;
    animation: tb-blink 4.2s infinite;
  }
  .tb-sweat {
    animation: tb-sweat 1.6s ease-in infinite;
  }
  .tb-label {
    font-family: "Nunito", "Huninn", sans-serif;
    font-size: 34px;
    font-weight: 900;
    fill: #4a2a1f;
    stroke: #fff;
    stroke-width: 7px;
    stroke-linejoin: round;
    paint-order: stroke;
    font-variant-numeric: tabular-nums;
  }
  .tb-zzz text {
    font-family: "Nunito", sans-serif;
    font-weight: 900;
    font-size: 20px;
    fill: #5b8fd8;
    animation: tb-float 2.4s ease-in-out infinite;
  }
  .tb-zzz text + text {
    font-size: 26px;
    animation-delay: 0.6s;
  }

  &.bounce {
    animation: tb-bob 2.6s ease-in-out infinite;
  }
  &.mood-paused,
  &.mood-paused .tb-wave,
  &.mood-paused .tb-leaf {
    animation-play-state: paused;
  }
  &.mood-cheer.bounce {
    animation: tb-jump 0.7s ease-in-out infinite;
  }
}

@keyframes tb-wave {
  from { transform: translateX(0); }
  to { transform: translateX(-100px); }
}
@keyframes tb-wiggle {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
@keyframes tb-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}
@keyframes tb-bob {
  0%, 100% { transform: translateY(0) scale(1, 1); }
  50% { transform: translateY(-5px) scale(1.02, 0.98); }
}
@keyframes tb-jump {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px) rotate(-3deg); }
  70% { transform: translateY(0) scale(1.05, 0.95); }
}
@keyframes tb-sweat {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(12px); opacity: 0; }
}
@keyframes tb-float {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-6px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .tomato-buddy,
  .tomato-buddy * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
