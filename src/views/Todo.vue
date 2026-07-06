<template>
  <div class="app-todo">
    <div class="container">
      <section class="header">
        <div
          class="text header-toggle"
          role="button"
          tabindex="0"
          :aria-expanded="calOpen"
          aria-label="展開行事曆"
          @click="calOpen = !calOpen"
          @keydown.enter.prevent="calOpen = !calOpen"
        >
          <span class="day" v-text="headDay"> </span>
          <span class="yearMonth"
            ><b class="year" v-text="headYear"></b><b class="month" v-text="headMonth"> </b
          ></span>
          <span class="caret" :class="{ open: calOpen }">▾</span>
          <span v-text="timeMessage"></span><span class="week" v-text="headWeek"> </span>
        </div>
      </section>

      <CalendarPanel v-if="calOpen" @select="onCalSelect" />

      <section class="addTask">
        <input placeholder="+ Add task" v-model="newTodo" @keyup.enter="addTodo" />
        <button type="button" class="chip-date" @click.stop="popOpen = !popOpen">
          📅 {{ chipLabel }}
        </button>
        <a class="btn btn--add" @click="addTodo">+</a>
        <div class="date-pop" v-if="popOpen" @click.stop>
          <button type="button" @click="quickPick(0)">今天</button>
          <button type="button" @click="quickPick(1)">明天</button>
          <button type="button" @click="quickPick(7)">下週</button>
          <label>
            或選日期
            <input type="date" v-model="newTodoDate" @change="popOpen = false" />
          </label>
        </div>
      </section>

      <section class="pomodoro">
        <div class="pomodoro__modes">
          <button
            class="btn pomodoro__mode p-1"
            :class="{ active: pomodoroMode === '25/5' }"
            @click="pomodoroStore.setMode('25/5')"
          >
            25/5
          </button>
          <button
            class="btn pomodoro__mode p-1"
            :class="{ active: pomodoroMode === '50/10' }"
            @click="pomodoroStore.setMode('50/10')"
          >
            50/10
          </button>
        </div>
        <span class="pomodoro__hint">按任務列的 ▶ 開始專注</span>
      </section>

      <div class="daynav">
        <button
          v-for="p in navPills"
          :key="p.date"
          type="button"
          class="btn daynav__pill"
          :class="{ active: viewDate === p.date }"
          @click="todoStore.setViewDate(p.date)"
        >
          {{ p.label }}
        </button>
        <button
          type="button"
          class="btn daynav__today"
          v-show="viewDate !== todayStr"
          @click="todoStore.setViewDate(todayStr)"
        >
          回今天 ↩
        </button>
      </div>

      <section class="content">
        <div class="rail" ref="rail" @scroll.passive="onRailScroll">
          <div class="day-card" v-for="d in dayWindow" :key="d">
            <h3 class="day-card__label">{{ dayLabel(d) }}</h3>
            <button
              type="button"
              class="overdue-banner"
              v-if="d === todayStr && overdueTodos.length"
              @click="todoStore.setViewDate(latestOverdueDate)"
            >
              ⚠ 有 {{ overdueTodos.length }} 件過去未完成 — 查看
            </button>
            <div class="todoList" v-if="listFor(d).length">
              <TodoList
                v-for="item in listFor(d)"
                :key="item.id"
                :item="item"
                @remove-todo="removeTodo"
                @edit-todo="editTodo"
                @mark-todo="markTodos"
              ></TodoList>
            </div>
            <div class="day-card__empty" v-else>
              <b>🌤</b>
              這天沒有任務<br />在上方輸入框直接新增
            </div>
          </div>
        </div>
      </section>

      <div class="filters">
        <button
          class="btn filters__btn filters__btn--all p-2"
          :class="{ active: filter === 'all' }"
          @click="todoStore.setFilter('all')"
        >
          All
        </button>
        <button
          class="btn filters__btn filters__btn--complete p-2"
          :class="{ active: filter === 'done' }"
          @click="todoStore.setFilter('done')"
        >
          Complete
        </button>
        <button
          class="btn filters__btn filters__btn--incomplete p-2"
          :class="{ active: filter === 'todo' }"
          @click="todoStore.setFilter('todo')"
        >
          Incomplete
        </button>
      </div>
    </div>

    <FocusOverlay />

    <!-- Modal -->
    <div
      class="modal fade"
      id="editModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content container">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Edit</h5>
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
              <p class="title text-left">Date(這天要做):</p>
              <input class="form-control" type="date" v-model="cacheDate" />
            </div>
            <div class="">
              <p class="title text-left">Comments:</p>
              <input
                class="form-control"
                type="text"
                placeholder="Add Comment..."
                @keyup.enter="addComment()"
                v-model="commentText"
              />
              <div
                class="comment-list m-2 py-2"
                v-for="(data, index) in editingTodo?.comments"
                :key="index"
                :class="{ 'border-bottom': index !== editingTodo.comments.length - 1 }"
              >
                <div class="d-flex px-3">
                  <span>{{ data }}</span>
                  <button
                    class="btn close ml-auto mx-1"
                    type="button"
                    aria-label="Close"
                    @click="removeComment(index)"
                  >
                    <font-awesome-icon icon="trash-alt" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer justify-content-center">
            <button
              type="button"
              class="btn btn-secondary btn--save"
              data-dismiss="modal"
              @click="doneEdit()"
            >
              Close & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/_todo.scss";

/* ── header:可點擊展開行事曆 ── */
.app-todo .header-toggle {
  cursor: pointer;

  .caret {
    font-size: 0.8rem;
    color: #6b6120;
    transition: transform 0.25s;
    &.open {
      transform: rotate(180deg);
    }
  }
}

/* ── 行事曆面板 ── */
.app-todo .calendar-panel {
  background: #ffcc22;
  padding: 0 14px 14px;

  .cal-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding-bottom: 4px;
  }
  .cal-title {
    font-size: 0.85rem;
    font-weight: 800;
    color: #574d14;
  }
  .cal-nav {
    border: 0;
    background: none;
    font-size: 1.1rem;
    color: #574d14;
    cursor: pointer;
    padding: 0 0.6rem;
    font-family: inherit;
  }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    text-align: center;
  }
  .dow {
    font-size: 0.62rem;
    font-weight: 800;
    color: #6b6120;
    padding: 4px 0;
  }
  .cal-cell {
    position: relative;
    border: 0;
    background: none;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    color: #574d14;
    padding: 7px 0 11px;
    border-radius: 10px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.35);
    }
    &.dim {
      opacity: 0.55;
    }
    &.today {
      outline: 2px solid #fff;
      outline-offset: -2px;
    }
    &.sel {
      background: #fff;
      color: #dfa900;
    }
    .dots {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 4px;
      display: flex;
      gap: 3px;
      justify-content: center;
    }
    .dot {
      width: 4.5px;
      height: 4.5px;
      border-radius: 50%;
      background: #8a7a1e;

      &.red {
        background: #d63030;
      }
      &.grn {
        background: #1b7d2c;
      }
    }
    &.sel .dot {
      background: #dfa900;
    }
  }
}

/* ── 新增任務的日期 chip 與快選 ── */
.app-todo .addTask {
  input {
    padding-right: 8.2rem;
  }
  .chip-date {
    position: absolute;
    right: 4.2rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    background: #fff3cc;
    color: #b98f00;
    font-size: 0.74rem;
    font-weight: 800;
    border: 0;
    border-radius: 2rem;
    padding: 5px 10px;
    cursor: pointer;
    font-family: inherit;
  }
  .date-pop {
    position: absolute;
    right: 1rem;
    top: calc(100% - 6px);
    z-index: 40;
    background: #fff;
    border: 1px solid #ede7d8;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(120, 95, 10, 0.18);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 172px;
    text-align: left;

    button {
      font: inherit;
      font-size: 0.85rem;
      text-align: left;
      border: 0;
      background: none;
      color: #4a4a4a;
      padding: 7px 10px;
      border-radius: 8px;
      cursor: pointer;

      &:hover {
        background: #fff3cc;
      }
    }
    label {
      font-size: 0.72rem;
      color: #9d9689;
      padding: 4px 10px 6px;
      margin: 0;

      input[type="date"] {
        display: block;
        width: 100%;
        font: inherit;
        font-size: 0.8rem;
        margin-top: 2px;
        border: 1px solid #ede7d8;
        border-radius: 6px;
        padding: 2px 6px;
      }
    }
  }
}

/* ── 蕃茄鐘模式列 ── */
.app-todo .pomodoro {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0 1rem;

  &__modes {
    display: inline-flex;
    border: 1px solid #ffcc22;
    border-radius: 1.5rem;
    overflow: hidden;
  }
  &__mode {
    border-radius: 0;
    color: #b98f00;
    font-weight: bold;
    min-width: 3.5rem;

    &.active {
      background: #ffcc22;
      color: #ffffff;
    }
  }
  &__hint {
    margin-left: auto;
    font-size: 0.7rem;
    color: #9d9689;
  }
}

/* ── 日子膠囊列 ── */
.app-todo .daynav {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 0;

  &__pill {
    font-size: 0.74rem;
    font-weight: 800;
    border: 1.5px solid #ede7d8;
    color: #9d9689;
    border-radius: 2rem;
    padding: 3px 12px;

    &.active {
      background: #ffcc22;
      border-color: #ffcc22;
      color: #fff;
    }
  }
  &__today {
    margin-left: auto;
    font-size: 0.72rem;
    font-weight: 800;
    color: #b98f00;
    border: 0;
    background: none;
  }
}

/* ── 每日卡片軌道 ── */
.app-todo .rail {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
.app-todo .day-card {
  flex: 0 0 100%;
  min-width: 0;
  scroll-snap-align: center;
  min-height: 235px;
  padding-bottom: 6px;

  &__label {
    font-size: 0.76rem;
    color: #9d9689;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-align: left;
    margin: 10px 16px 0;
  }
  &__empty {
    color: #9d9689;
    font-size: 0.82rem;
    text-align: center;
    padding: 52px 0;

    b {
      display: block;
      font-size: 1.6rem;
      margin-bottom: 6px;
    }
  }
}
.app-todo .overdue-banner {
  display: block;
  width: calc(100% - 32px);
  margin: 8px 16px 0;
  text-align: left;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  color: #d63030;
  background: rgba(255, 63, 63, 0.09);
  border: 0;
  border-radius: 10px;
  padding: 7px 11px;
  cursor: pointer;
}

/* ── 逾期任務的移動快速鍵 ── */
.app-todo .noteArea {
  .late {
    color: #ff3f3f;
    font-weight: bold;
  }
  .btn-move-today {
    font-size: inherit;
    font-weight: bold;
    color: #b98f00;
    padding: 0 4px;
    opacity: 1;
  }
  .tomato-count {
    font-size: inherit;
  }
}

/* ── 專注遮罩(半透明灰 + 模糊) ── */
.focus-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  background: rgba(60, 58, 52, 0.55);
  -webkit-backdrop-filter: blur(10px) saturate(0.85);
  backdrop-filter: blur(10px) saturate(0.85);
  color: #fff;
  text-align: center;
  padding: 2rem 1.5rem;

  .fo-phase {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.25em;
    color: #ffcc22;
    text-transform: uppercase;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }
  .fo-ringwrap {
    position: relative;
    width: 210px;
    height: 210px;

    svg {
      transform: rotate(-90deg);
    }
  }
  .fo-ring-bg {
    stroke: rgba(255, 255, 255, 0.25);
  }
  .fo-ring-fg {
    stroke: #ffcc22;
    transition: stroke-dashoffset 1s linear;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
  }
  .fo-time {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.9rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  }
  .fo-task {
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }
  .fo-paused {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.75);
    visibility: hidden;

    &.show {
      visibility: visible;
    }
  }
  .fo-ctrl {
    display: flex;
    gap: 1.4rem;
    margin-top: 0.4rem;

    button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
    }
  }
  .fo-toggle {
    background: #ffcc22;
    border: 0;
    color: #3d3012;
  }
  .fo-stop {
    background: rgba(255, 255, 255, 0.85);
    border: 2px solid #ff6b6b;
    color: #ff3f3f;
  }
  .fo-hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.65);
  }

  &.is-break {
    .fo-phase {
      color: #7ee08e;
    }
    .fo-ring-fg {
      stroke: #4cc964;
    }
    .fo-toggle {
      background: #4cc964;
      color: #12300f;
    }
  }
}
@supports not (backdrop-filter: blur(1px)) {
  .focus-overlay {
    background: rgba(55, 53, 48, 0.85); /* 不支援模糊時提高不透明度保持可讀 */
  }
}
@media (prefers-reduced-motion: reduce) {
  .focus-overlay .fo-ring-fg,
  .app-todo .header-toggle .caret {
    transition: none;
  }
}
</style>

<script>
import moment from "moment";
import { mapState } from "pinia";
import TodoList from "@/components/TodoList.vue";
import CalendarPanel from "@/components/CalendarPanel.vue";
import FocusOverlay from "@/components/FocusOverlay.vue";
import { useTodoStore, today } from "@/stores/todo";
import { usePomodoroStore } from "@/stores/pomodoro";

const WINDOW_RADIUS = 30; // 卡片視窗:檢視日前後各 30 天

export default {
  name: "Todo",
  components: { TodoList, CalendarPanel, FocusOverlay },
  setup() {
    const todoStore = useTodoStore();
    const pomodoroStore = usePomodoroStore();
    return { todoStore, pomodoroStore };
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
      clockTimer: null
    };
  },
  computed: {
    ...mapState(useTodoStore, [
      "filter",
      "viewDate",
      "editingTodo",
      "overdueTodos",
      "latestOverdueDate"
    ]),
    ...mapState(usePomodoroStore, { pomodoroMode: "mode" }),
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
      return this.todoStore.visibleOn(d);
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
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("click", this.closePop);
  }
};
</script>
