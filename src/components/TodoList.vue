<template>
  <div
    class="todo-item"
    :data-id="item.id"
    :class="{ done: item.completed, starred: item.marked, dragging, focusing: isFocusing }"
  >
    <button
      v-if="draggable"
      type="button"
      class="ti-handle"
      aria-label="拖曳排序(也可用上下鍵)"
      title="拖曳排序"
      @pointerdown="$emit('drag-start', $event, item)"
      @keydown.up.prevent="$emit('nudge', item, -1)"
      @keydown.down.prevent="$emit('nudge', item, 1)"
    >
      <span></span><span></span><span></span>
    </button>

    <label class="ti-check" :for="'todo-' + item.id">
      <input type="checkbox" v-model="item.completed" :id="'todo-' + item.id" />
      <span class="ti-box" aria-hidden="true"></span>
    </label>

    <div class="ti-body">
      <label class="ti-title" :for="'todo-' + item.id">{{ item.title }}</label>
      <div class="ti-meta" v-if="item.tomatoes || (item.comments && item.comments.length) || isOverdue">
        <span class="ti-tomatoes" v-if="item.tomatoes" :title="`${item.tomatoes} 顆蕃茄`">
          🍅<b v-if="item.tomatoes > 1">×{{ item.tomatoes }}</b>
        </span>
        <span class="ti-comments" v-if="item.comments && item.comments.length">
          <font-awesome-icon :icon="['far', 'comment-dots']" /> {{ item.comments.length }}
        </span>
        <span class="ti-overdue" v-if="isOverdue">
          <span class="late">逾期</span>
          <button type="button" class="btn-move-today" @click="moveToToday">移到今天 →</button>
        </span>
      </div>
    </div>

    <div class="ti-actions">
      <button class="ti-btn ti-star" :class="{ active: item.marked }" type="button"
        :aria-label="item.marked ? '取消重要' : '標為重要'" :aria-pressed="item.marked" @click="markTodos(item)">
        <font-awesome-icon icon="star" />
      </button>
      <button type="button" class="ti-btn ti-play" :class="{ running: isFocusing }"
        :aria-label="isFocusing ? '停止蕃茄鐘' : '開始蕃茄鐘'" :title="isFocusing ? '停止蕃茄鐘' : '開始蕃茄鐘'"
        @click="togglePomodoro">
        <font-awesome-icon :icon="isFocusing ? 'stop' : 'play'" />
      </button>
      <button type="button" class="ti-btn ti-edit" aria-label="編輯" @click="editTodo(item)"
        data-toggle="modal" data-target="#editModal">
        <font-awesome-icon icon="edit" />
      </button>
      <button class="ti-btn ti-del" type="button" aria-label="刪除" @click="removeTodo(item)">
        <font-awesome-icon icon="trash-alt" />
      </button>
    </div>
  </div>
</template>
<script>
import { usePomodoroStore } from '@/stores/pomodoro'
import { useTodoStore, today } from '@/stores/todo'

export default {
  name: 'TodoList',
  props: {
    item: { type: Object, required: true },
    draggable: { type: Boolean, default: false },
    dragging: { type: Boolean, default: false }
  },
  emits: ['remove-todo', 'edit-todo', 'mark-todo', 'drag-start', 'nudge'],
  setup () {
    const pomodoroStore = usePomodoroStore()
    const todoStore = useTodoStore()
    return { pomodoroStore, todoStore }
  },
  computed: {
    isFocusing () {
      return this.pomodoroStore.isRunning && this.pomodoroStore.activeTodoId === this.item.id
    },
    isOverdue () {
      return !this.item.completed && this.item.date < today()
    }
  },
  methods: {
    togglePomodoro () {
      if (this.isFocusing) {
        this.pomodoroStore.stop()
      } else {
        this.pomodoroStore.startFocus(this.item.id)
      }
    },
    moveToToday () {
      this.todoStore.moveTodo(this.item, today())
    },
    removeTodo (item) {
      this.$emit('remove-todo', item)
    },
    editTodo (item) {
      this.$emit('edit-todo', item)
    },
    markTodos (item) {
      this.$emit('mark-todo', item)
    }
  }
}
</script>
