<template>
  <div>
    <div class="list-group-item text-left">
        <div class="d-flex">
          <div class="form-check">
            <label class="form-check-label" :for="item.id"
            :class="{'completed': item.completed }">{{ item.title }}
              <input class="form-check-input" type="checkbox"
              v-model="item.completed" :id="item.id"/>
              <span class="checkmark"></span>
            </label>
          </div>
          <button type="button" class="btn btn-pomodoro mx-1" :class="{'running': isFocusing }"
          :title="isFocusing ? 'Stop pomodoro' : 'Start pomodoro'" @click="togglePomodoro">
            <font-awesome-icon :icon="isFocusing ? 'stop' : 'play'"/>
          </button>
          <button type="button" class="btn btn-default btn-edit mx-1" @click="editTodo(item)"
          data-toggle="modal" data-target="#editModal">
            <font-awesome-icon icon="edit"/>
          </button>
          <button class="btn close ml-auto mx-1" type="button"
          aria-label="Close" @click="removeTodo(item)">
            <font-awesome-icon icon="trash-alt" />
          </button>
          <button class="btn star ml-auto" :class="{'active': item.marked }"
          type="button" aria-label="" @click="markTodos(item)">
            <font-awesome-icon icon="star" />
          </button>
        </div>
        <div class="pl-4 noteArea">
          <span class="date px-2">
            <b class="icon"><font-awesome-icon :icon="['far','calendar-check']"/></b>
            {{ item.messageDate }}
          </span>
          <span class="comment-count px-2"
          v-if="item.comments">
            <b class="icon"><font-awesome-icon :icon="['far','comment-dots']"/></b>
            {{ item.comments.length }}
          </span>
          <span class="tomato-count px-2" v-if="item.tomatoes">
            🍅 {{ item.tomatoes }}
          </span>
          <span class="overdue-area" v-if="isOverdue">
            <span class="late px-1">逾期</span>
            <button type="button" class="btn btn-move-today" @click="moveToToday">
              移到今天 →
            </button>
          </span>
        </div>
    </div>
  </div>
</template>
<script>
import { usePomodoroStore } from '@/stores/pomodoro'
import { useTodoStore, today } from '@/stores/todo'

export default {
  name: 'TodoList',
  props: ['item'],
  emits: ['remove-todo', 'edit-todo', 'mark-todo'],
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
