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
          <span class="due-date px-2" :class="{ 'overdue': isOverdue }" v-if="item.dueDate">
            <b class="icon"><font-awesome-icon icon="calendar-alt"/></b>
            {{ item.dueDate }}<template v-if="isOverdue"> (逾期)</template>
          </span>
        </div>
    </div>
  </div>
</template>
<script>
import moment from 'moment'
import { usePomodoroStore } from '@/stores/pomodoro'

export default {
  name: 'TodoList',
  props: ['item'],
  emits: ['remove-todo', 'edit-todo', 'mark-todo'],
  setup () {
    const pomodoroStore = usePomodoroStore()
    return { pomodoroStore }
  },
  computed: {
    isFocusing () {
      return this.pomodoroStore.isRunning && this.pomodoroStore.activeTodoId === this.item.id
    },
    isOverdue () {
      // dueDate 為 YYYY-MM-DD,字串比較即為日期比較
      return !!this.item.dueDate && !this.item.completed &&
        this.item.dueDate < moment().format('YYYY-MM-DD')
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
