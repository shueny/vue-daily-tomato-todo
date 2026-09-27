<template>
  <div class="app-todo" :class="'theme-' + ui.theme">
    <div class="container app-card">
      <div class="topbar">
        <span class="topbar__brand">DAILY TOMATO</span>
        <div class="theme-switch" role="group" aria-label="介面主題">
          <button
            v-for="t in themeOptions"
            :key="t.key"
            type="button"
            :class="{ active: ui.theme === t.key }"
            :aria-pressed="ui.theme === t.key"
            @click="ui.setTheme(t.key)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <section class="header">
        <div
          class="header-toggle"
          role="button"
          tabindex="0"
          :aria-expanded="calOpen"
          aria-label="展開行事曆"
          @click="calOpen = !calOpen"
          @keydown.enter.prevent="calOpen = !calOpen"
        >
          <span class="day" v-text="headDay"></span>
          <span class="yearMonth">
            <b class="month" v-text="ui.isRetro ? headMonth + ' · ' + headWeek : headMonth"></b>
            <b class="year" v-text="headYear"></b>
          </span>
          <span class="caret" :class="{ open: calOpen }">▾</span>
          <span class="hd-right">
            <b class="week" v-text="headWeek"></b>
            <b class="clock" v-text="timeMessage"></b>
          </span>
        </div>
        <div class="hd-buddy" v-if="!ui.isRetro">
          <TomatoBuddy :size="62" :mood="headerMood" bounce />
        </div>
        <button
          v-else
          type="button"
          class="duration-pill"
          :aria-label="durationLabel"
          @click="ui.durationOpen = true"
        >
          <span class="duration-pill__text">
            <small>專注 · 休息</small>
            <b>{{ focusMinutes }} · {{ breakMinutes }} 分</b>
          </span>
          <span class="duration-pill__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
          </span>
        </button>
      </section>

      <transition name="cal-slide">
        <CalendarPanel v-if="calOpen" @select="onCalSelect" />
      </transition>

      <section class="addTask">
        <input placeholder="今天想完成什麼呢?" v-model="newTodo" @keyup.enter="addTodo" />
        <button type="button" class="chip-date" @click.stop="popOpen = !popOpen">
          <span class="emoji" aria-hidden="true">📅</span> {{ chipLabel }}
        </button>
        <button type="button" class="btn--add" aria-label="新增任務" @click="addTodo">+</button>
        <transition name="pop">
        <div class="date-pop" v-if="popOpen" @click.stop>
          <button type="button" @click="quickPick(0)">今天</button>
          <button type="button" @click="quickPick(1)">明天</button>
          <button type="button" @click="quickPick(7)">下週</button>
          <label>
            或選日期
            <input type="date" v-model="newTodoDate" @change="popOpen = false" />
          </label>
        </div>
        </transition>
      </section>

      <section class="pomodoro" v-if="!ui.isRetro">
        <button type="button" class="pomodoro__length" :aria-label="durationLabel" @click="ui.durationOpen = true">
          ⏱ 專注 <b>{{ focusMinutes }}</b> · 休息 <b>{{ breakMinutes }}</b>
          <span class="pomodoro__edit">調整</span>
        </button>
        <span class="pomodoro__hint">按 <b class="mini-play">▶</b> 種蕃茄</span>
      </section>

      <div class="daynav">
        <button
          v-for="p in navPills"
          :key="p.date"
          type="button"
          class="daynav__pill"
          :class="{ active: viewDate === p.date }"
          @click="todoStore.setViewDate(p.date)"
        >
          {{ p.label }}
        </button>
        <button
          type="button"
          class="daynav__today"
          v-show="viewDate !== todayStr"
          @click="todoStore.setViewDate(todayStr)"
        >
          回今天 ↩
        </button>
      </div>

      <div class="sortbar">
        <span class="sortbar__label">排序</span>
        <div class="sortbar__chips" role="group" aria-label="排序方式">
          <button
            v-for="s in sortOptions"
            :key="s.key"
            type="button"
            class="sortbar__chip"
            :class="{ active: sortMode === s.key }"
            :aria-pressed="sortMode === s.key"
            :title="s.title"
            @click="todoStore.setSortMode(s.key)"
          >
            <span class="emoji" aria-hidden="true">{{ s.icon }}</span> {{ s.label }}
          </button>
        </div>
      </div>

      <section class="content">
        <div class="rail" ref="rail" @scroll.passive="onRailScroll">
          <div class="day-card" v-for="d in dayWindow" :key="d">
            <div class="day-card__head">
              <h3 class="day-card__label">{{ dayLabel(d) }}</h3>
              <span class="day-card__stats" v-if="statsFor(d).total">
                {{ statsFor(d).done }}/{{ statsFor(d).total }} 完成
                <template v-if="statsFor(d).tomatoes">
                  · {{ ui.isRetro ? statsFor(d).tomatoes + ' 顆蕃茄' : '🍅×' + statsFor(d).tomatoes }}
                </template>
              </span>
            </div>
            <div class="progress-ticks" v-if="ui.isRetro && statsFor(d).total" aria-hidden="true">
              <span
                v-for="i in tickCount(d)"
                :key="i"
                :class="{ on: i <= ticksOn(d) }"
              ></span>
            </div>
            <div class="progress-vine" v-else-if="statsFor(d).total" aria-hidden="true">
              <div class="progress-vine__fill" :style="{ width: progressOf(d) + '%' }"></div>
              <span class="progress-vine__knob" :style="{ left: progressOf(d) + '%' }">
                {{ progressOf(d) === 100 ? '🎉' : '🍅' }}
              </span>
            </div>
            <button
              type="button"
              class="overdue-banner"
              v-if="d === todayStr && overdueTodos.length"
              @click="todoStore.setViewDate(latestOverdueDate)"
            >
              ⚠ 有 {{ overdueTodos.length }} 件過去未完成 — 查看
            </button>
            <transition-group
              name="todo-anim"
              tag="div"
              class="todoList"
              :class="{ 'is-dragging': drag }"
              v-if="listFor(d).length"
            >
              <TodoList
                v-for="item in listFor(d)"
                :key="item.id"
                :item="item"
                :draggable="sortMode === 'manual'"
                :dragging="!!drag && drag.id === item.id"
                @remove-todo="removeTodo"
                @edit-todo="editTodo"
                @mark-todo="markTodos"
                @drag-start="onDragStart"
                @nudge="(it, dir) => onNudge(it, dir, d)"
              ></TodoList>
            </transition-group>
            <div class="day-card__empty" v-else>
              <svg v-if="ui.isRetro" class="empty-logo" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7c4.5-1.5 9 1 9 6s-4 8-9 8-9-3-9-8 4.5-7.5 9-6z" /><path d="M12 7l-3.5-2M12 7l3.5-2M12 7V3M12 7l-4.5 1.2M12 7l4.5 1.2" /></svg>
              <TomatoBuddy v-else :size="72" mood="sleep" />
              <p>這天還沒有任務<br />在上方輸入框新增一個吧</p>
            </div>
            <p class="day-card__tip" v-if="listFor(d).length > 1 && sortMode === 'manual'">
              按住 ⋮⋮ 拖曳就能排順序
            </p>
          </div>
        </div>
      </section>

      <div class="filters" role="group" aria-label="顯示">
        <button
          v-for="f in filterOptions"
          :key="f.key"
          type="button"
          class="filters__btn"
          :class="{ active: filter === f.key }"
          :aria-pressed="filter === f.key"
          @click="todoStore.setFilter(f.key)"
        >
          {{ f.label }}
        </button>
        <button
          type="button"
          class="filters__sink"
          :class="{ active: sinkDone }"
          :aria-pressed="sinkDone"
          title="已完成的任務自動沉到最下面"
          @click="todoStore.toggleSinkDone()"
        >
          ✓ 完成沉底
        </button>
      </div>
    </div>

    <FocusOverlay />
    <DurationSheet />

    <!-- Modal -->
    <div
      class="modal fade"
      id="editModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="editModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content edit-modal">
          <div class="modal-header">
            <TomatoBuddy :size="40" mood="cheer" />
            <h5 class="modal-title" id="editModalLabel">編輯任務</h5>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <input
                class="form-control"
                type="text"
                v-model="cacheTodoTitle"
                @keyup.esc="cancelEdit()"
                @keyup.enter="doneEdit()"
              />
            </div>
            <div class="mb-3">
              <p class="title">這天要做</p>
              <div class="edit-date">
                <input class="form-control" type="date" v-model="cacheDate" />
                <button type="button" @click="cacheDate = shiftDate(0)">今天</button>
                <button type="button" @click="cacheDate = shiftDate(1)">明天</button>
                <button type="button" @click="cacheDate = shiftDate(7)">下週</button>
              </div>
            </div>
            <div>
              <p class="title">備註</p>
              <input
                class="form-control"
                type="text"
                placeholder="寫點備註,按 Enter 新增…"
                @keyup.enter="addComment()"
                v-model="commentText"
              />
              <div
                class="comment-list"
                v-for="(data, index) in editingTodo?.comments"
                :key="index"
              >
                <span>{{ data }}</span>
                <button
                  class="comment-del"
                  type="button"
                  aria-label="刪除備註"
                  @click="removeComment(index)"
                >
                  <font-awesome-icon icon="trash-alt" />
                </button>
              </div>
            </div>
            <p class="created" v-if="editingTodo?.messageDate">建立於 {{ editingTodo.messageDate }}</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button
              type="button"
              class="btn--delete"
              data-dismiss="modal"
              @click="deleteEditing()"
            >
              刪除任務
            </button>
            <button
              type="button"
              class="btn--save"
              data-dismiss="modal"
              @click="doneEdit()"
            >
              儲存 <span class="emoji" aria-hidden="true">🍅</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/_todo.scss";
@import "@/assets/scss/_retro.scss";

/* ── 動畫 ── */
/* 清單項目:進場彈跳、離場滑出、重排平移 */
.todo-anim-enter-active {
  animation: todo-in 0.45s cubic-bezier(0.2, 0.8, 0.3, 1.2);
}
.todo-anim-leave-active {
  transition: all 0.3s ease;
}
.todo-anim-leave-to {
  opacity: 0;
  transform: translateX(48px) rotate(4deg);
}
.todo-anim-move {
  transition: transform 0.3s cubic-bezier(0.3, 1.2, 0.5, 1);
}
@keyframes todo-in {
  0% {
    opacity: 0;
    transform: translateY(-16px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateY(3px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
/* 行事曆展開/收合 */
.cal-slide-enter-active,
.cal-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
  transform-origin: top;
}
.cal-slide-enter-from,
.cal-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.96);
}
/* 日期快選浮層 */
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.97);
}
/* 專注遮罩淡入淡出 */
.fo-fade-enter-active,
.fo-fade-leave-active {
  transition: opacity 0.28s ease;
}
.fo-fade-enter-from,
.fo-fade-leave-to {
  opacity: 0;
}
/* +1 蕃茄的小彈跳 */
.fo-pop-enter-active {
  animation: ti-pop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.fo-pop-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fo-pop-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
@media (prefers-reduced-motion: reduce) {
  .app-todo *,
  .todo-anim-enter-active,
  .todo-anim-leave-active,
  .todo-anim-move,
  .cal-slide-enter-active,
  .cal-slide-leave-active,
  .pop-enter-active,
  .pop-leave-active,
  .fo-fade-enter-active,
  .fo-fade-leave-active,
  .fo-pop-enter-active,
  .fo-pop-leave-active {
    transition: none !important;
    animation: none !important;
  }
}
</style>

<script>
import moment from "moment";
import { mapState } from "pinia";
import TodoList from "@/components/TodoList.vue";
import CalendarPanel from "@/components/CalendarPanel.vue";
import FocusOverlay from "@/components/FocusOverlay.vue";
import TomatoBuddy from "@/components/TomatoBuddy.vue";
import DurationSheet from "@/components/DurationSheet.vue";
import { useUiStore } from "@/stores/ui";
import { useTodoStore, today } from "@/stores/todo";
import { usePomodoroStore } from "@/stores/pomodoro";

const WINDOW_RADIUS = 30; // 卡片視窗:檢視日前後各 30 天

export default {
  name: "Todo",
  components: { TodoList, CalendarPanel, FocusOverlay, TomatoBuddy, DurationSheet },
  setup() {
    const todoStore = useTodoStore();
    const pomodoroStore = usePomodoroStore();
    return { todoStore, pomodoroStore, ui: useUiStore() };
  },
  data() {
    return {
      newTodo: "",
      newTodoDate: useTodoStore().viewDate,
      cacheTodoTitle: "",
      cacheDate: "",
      commentText: "",
      calOpen: false,
      popOpen: false,
      dayWindow: [],
      programmaticScroll: false,
      timeMessage: moment().format("LTS"),
      clockTimer: null,
      drag: null, // 拖曳排序中:{ id, listEl }
      sortOptions: [
        { key: "manual", icon: "✋", label: "自訂", title: "自己拖曳排順序" },
        { key: "star", icon: "⭐", label: "重要", title: "星號任務排前面" },
        { key: "tomato", icon: "🍅", label: "蕃茄", title: "蕃茄多的排前面" },
        { key: "newest", icon: "🆕", label: "最新", title: "最新新增的排前面" }
      ],
      themeOptions: [
        { key: "cute", label: "可愛" },
        { key: "retro", label: "復古" }
      ],
      filterOptions: [
        { key: "all", label: "全部" },
        { key: "todo", label: "未完成" },
        { key: "done", label: "已完成" }
      ]
    };
  },
  computed: {
    ...mapState(useTodoStore, [
      "filter",
      "viewDate",
      "editingTodo",
      "overdueTodos",
      "latestOverdueDate",
      "sortMode",
      "sinkDone"
    ]),
    ...mapState(usePomodoroStore, ["focusMinutes", "breakMinutes"]),
    durationLabel() {
      return `調整時間,目前專注 ${this.focusMinutes} 分、休息 ${this.breakMinutes} 分`;
    },
    todayStr() {
      return today();
    },
    headDay() {
      return moment(this.viewDate, "YYYY-MM-DD").format("DD");
    },
    headYear() {
      return moment(this.viewDate, "YYYY-MM-DD").format("YYYY");
    },
    headMonth() {
      return moment(this.viewDate, "YYYY-MM-DD").format("MMM");
    },
    headWeek() {
      return moment(this.viewDate, "YYYY-MM-DD").format("ddd");
    },
    headerMood() {
      const st = this.todoStore.statsOn(this.viewDate);
      return st.total && st.done === st.total ? "cheer" : "happy";
    },
    chipLabel() {
      return this.relativeLabel(this.newTodoDate);
    },
    navPills() {
      const t = moment(today(), "YYYY-MM-DD");
      return [
        { date: t.clone().subtract(1, "day").format("YYYY-MM-DD"), label: "昨天" },
        { date: t.format("YYYY-MM-DD"), label: "今天" },
        { date: t.clone().add(1, "day").format("YYYY-MM-DD"), label: "明天" }
      ];
    }
  },
  methods: {
    relativeLabel(date) {
      const diff = moment(date, "YYYY-MM-DD").diff(moment(today(), "YYYY-MM-DD"), "days");
      if (diff === 0) return "今天";
      if (diff === 1) return "明天";
      if (diff === -1) return "昨天";
      return moment(date, "YYYY-MM-DD").format("M/D");
    },
    dayLabel(d) {
      const rel = this.relativeLabel(d);
      const base = moment(d, "YYYY-MM-DD").format("M/D dddd");
      return ["今天", "明天", "昨天"].includes(rel) ? `${rel} · ${base}` : base;
    },
    listFor(d) {
      return this.todoStore.sortedOn(d);
    },
    statsFor(d) {
      return this.todoStore.statsOn(d);
    },
    progressOf(d) {
      const st = this.statsFor(d);
      return st.total ? Math.round((st.done / st.total) * 100) : 0;
    },
    // 復古進度刻度:最多 12 格,任務多時按比例填
    tickCount(d) {
      return Math.min(this.statsFor(d).total, 12);
    },
    ticksOn(d) {
      const st = this.statsFor(d);
      return st.total <= 12 ? st.done : Math.round((st.done / st.total) * 12);
    },
    deleteEditing() {
      if (!this.editingTodo) return;
      this.todoStore.removeTodo(this.editingTodo);
      this.cancelEdit();
    },
    shiftDate(days) {
      return moment(today(), "YYYY-MM-DD").add(days, "day").format("YYYY-MM-DD");
    },
    // 開啟「完成沉底」時,未完成/已完成各自排,不能互相穿越
    canSwap(a, b) {
      return !this.sinkDone || a.completed === b.completed;
    },
    onDragStart(e, item) {
      if (this.sortMode !== "manual" || (e.button !== undefined && e.button !== 0)) return;
      e.preventDefault();
      const listEl = e.target.closest(".todoList");
      if (!listEl) return;
      this.drag = { id: item.id, listEl };
      window.addEventListener("pointermove", this.onDragMove);
      window.addEventListener("pointerup", this.onDragEnd);
      window.addEventListener("pointercancel", this.onDragEnd);
    },
    onDragMove(e) {
      if (!this.drag) return;
      const els = [...this.drag.listEl.querySelectorAll(".todo-item")].filter(
        (el) => !el.classList.contains("todo-anim-leave-active")
      );
      const from = els.findIndex((el) => el.dataset.id === String(this.drag.id));
      if (from < 0) return;
      let target = -1;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (i > from && e.clientY > mid) target = i; // 往下:取最遠一個越過中線的
        if (i < from && e.clientY < mid && target < 0) target = i; // 往上:取最上面那個
      });
      if (target < 0) return;
      const dragItem = this.todoStore.todos.find((t) => t.id === this.drag.id);
      const targetItem = this.todoStore.todos.find((t) => String(t.id) === els[target].dataset.id);
      if (dragItem && targetItem && this.canSwap(dragItem, targetItem)) {
        this.todoStore.reorder(dragItem.id, targetItem.id);
      }
    },
    onDragEnd() {
      this.drag = null;
      window.removeEventListener("pointermove", this.onDragMove);
      window.removeEventListener("pointerup", this.onDragEnd);
      window.removeEventListener("pointercancel", this.onDragEnd);
    },
    // 鍵盤排序:在拖曳把手上按上/下鍵
    onNudge(item, dir, d) {
      const list = this.listFor(d);
      const neighbor = list[list.indexOf(item) + dir];
      if (!neighbor || !this.canSwap(item, neighbor)) return;
      this.todoStore.reorder(item.id, neighbor.id);
      this.$nextTick(() => {
        const el = document.querySelector(`.todo-item[data-id="${item.id}"] .ti-handle`);
        if (el) el.focus();
      });
    },
    buildWindow(center) {
      const c = moment(center, "YYYY-MM-DD");
      const list = [];
      for (let i = -WINDOW_RADIUS; i <= WINDOW_RADIUS; i++) {
        list.push(c.clone().add(i, "day").format("YYYY-MM-DD"));
      }
      this.dayWindow = list;
    },
    scrollToDate(date, smooth) {
      const idx = this.dayWindow.indexOf(date);
      const rail = this.$refs.rail;
      if (idx < 0 || !rail) return;
      this.programmaticScroll = true;
      rail.scrollTo({ left: idx * rail.clientWidth, behavior: smooth ? "smooth" : "auto" });
      clearTimeout(this._progTimer);
      this._progTimer = setTimeout(() => {
        this.programmaticScroll = false;
      }, smooth ? 700 : 120);
    },
    onRailScroll() {
      if (this.programmaticScroll) return;
      const rail = this.$refs.rail;
      const idx = Math.round(rail.scrollLeft / rail.clientWidth);
      const d = this.dayWindow[idx];
      if (d && d !== this.viewDate) {
        this.todoStore.setViewDate(d);
      }
    },
    onCalSelect(date) {
      this.todoStore.setViewDate(date);
      this.calOpen = false;
    },
    quickPick(days) {
      this.newTodoDate = moment(today(), "YYYY-MM-DD").add(days, "day").format("YYYY-MM-DD");
      this.popOpen = false;
    },
    onResize() {
      this.scrollToDate(this.viewDate, false);
    },
    closePop() {
      this.popOpen = false;
    },
    addTodo() {
      this.todoStore.addTodo(this.newTodo.trim(), this.newTodoDate);
      this.newTodo = "";
      // 新增到別天時直接帶你過去看
      if (this.newTodoDate !== this.viewDate) {
        this.todoStore.setViewDate(this.newTodoDate);
      }
    },
    updateCurrentTime() {
      this.timeMessage = moment().format("LTS");
    },
    cancelEdit() {
      this.todoStore.stopEdit();
      this.cacheTodoTitle = "";
      this.cacheDate = "";
    },
    removeTodo(item) {
      this.todoStore.removeTodo(item);
    },
    editTodo(item) {
      this.todoStore.startEdit(item);
      this.cacheTodoTitle = item.title;
      this.cacheDate = item.date || "";
    },
    doneEdit() {
      if (!this.editingTodo) return;
      if (this.cacheTodoTitle) {
        this.todoStore.updateTitle(this.editingTodo, this.cacheTodoTitle);
      }
      if (this.cacheDate && this.cacheDate !== this.editingTodo.date) {
        this.todoStore.moveTodo(this.editingTodo, this.cacheDate);
      }
    },
    markTodos(item) {
      this.todoStore.toggleMark(item);
    },
    addComment() {
      this.todoStore.addComment(this.editingTodo, this.commentText);
      this.commentText = "";
    },
    removeComment(index) {
      this.todoStore.removeComment(this.editingTodo, index);
    }
  },
  watch: {
    viewDate(nv) {
      this.newTodoDate = nv;
      if (!this.dayWindow.includes(nv)) {
        this.buildWindow(nv);
        this.$nextTick(() => this.scrollToDate(nv, false));
        return;
      }
      const rail = this.$refs.rail;
      const target = this.dayWindow.indexOf(nv);
      const current = rail ? Math.round(rail.scrollLeft / rail.clientWidth) : -1;
      if (target !== current) {
        this.scrollToDate(nv, true);
      }
    }
  },
  created() {
    this.buildWindow(this.todoStore.viewDate);
    this.clockTimer = setInterval(() => this.updateCurrentTime(), 1 * 1000);
  },
  mounted() {
    this.scrollToDate(this.viewDate, false);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("click", this.closePop);
  },
  beforeUnmount() {
    clearInterval(this.clockTimer);
    this.onDragEnd();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("click", this.closePop);
  }
};
</script>
