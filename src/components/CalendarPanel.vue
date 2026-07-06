<template>
  <div class="calendar-panel">
    <div class="cal-head">
      <button class="cal-nav" type="button" aria-label="上個月" @click="shiftMonth(-1)">‹</button>
      <span class="cal-title">{{ monthTitle }}</span>
      <button class="cal-nav" type="button" aria-label="下個月" @click="shiftMonth(1)">›</button>
    </div>
    <div class="cal-grid">
      <span class="dow" v-for="w in weekdays" :key="w">{{ w }}</span>
      <span v-for="n in leadingBlanks" :key="'b' + n"></span>
      <button
        v-for="cell in cells"
        :key="cell.date"
        type="button"
        class="cal-cell"
        :class="{
          dim: !cell.count,
          today: cell.isToday,
          sel: cell.date === viewDate
        }"
        @click="$emit('select', cell.date)"
      >
        {{ cell.day }}
        <span class="dots" v-if="cell.count">
          <span class="dot" :class="{ red: cell.late, grn: !cell.open }"></span>
        </span>
      </button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { mapState } from 'pinia'
import { useTodoStore, today } from '@/stores/todo'

export default {
  name: 'CalendarPanel',
  emits: ['select'],
  data () {
    return {
      // 顯示中的月份(該月 1 號)
      month: moment(useTodoStore().viewDate, 'YYYY-MM-DD').startOf('month'),
      weekdays: ['日', '一', '二', '三', '四', '五', '六']
    }
  },
  computed: {
    ...mapState(useTodoStore, ['viewDate', 'countsByDate']),
    monthTitle () {
      return this.month.format('YYYY 年 M 月')
    },
    leadingBlanks () {
      return this.month.day()
    },
    cells () {
      const t = today()
      const days = this.month.daysInMonth()
      const list = []
      for (let d = 1; d <= days; d++) {
        const date = this.month.clone().date(d).format('YYYY-MM-DD')
        const c = this.countsByDate[date]
        list.push({
          date,
          day: d,
          isToday: date === t,
          count: c ? c.total : 0,
          open: c ? c.open : 0,
          late: c ? c.late > 0 : false
        })
      }
      return list
    }
  },
  methods: {
    shiftMonth (n) {
      this.month = this.month.clone().add(n, 'month')
    }
  },
  watch: {
    // 檢視日換到別的月份時,行事曆跟著翻頁
    viewDate (nv) {
      const m = moment(nv, 'YYYY-MM-DD').startOf('month')
      if (!m.isSame(this.month, 'month')) this.month = m
    }
  }
}
</script>
