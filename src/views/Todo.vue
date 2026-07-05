<template>
  <div class="app-todo">
    <div class="container">
      <section class="header">
        <div class="text">
          <span class="day" v-text="day"> </span>
          <span class="yearMonth"
            ><b class="year" v-text="year"></b><b class="month" v-text="month"> </b
          ></span>
          <span v-text="timeMessage"></span><span class="week" v-text="currentWeek"> </span>
        </div>
      </section>
      <section class="addTask">
        <input placeholder="+ Add task" v-model="newTodo" @keyup.enter="addTodo" />
        <a class="btn btn--add" @click="addTodo">+</a>
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
        <div class="pomodoro__status" v-if="isRunning">
          <span class="pomodoro__phase" :class="`pomodoro__phase--${phase}`">
            {{ phase === "focus" ? "🍅 專注中" : "☕ 休息中" }}
          </span>
          <span class="pomodoro__time">{{ displayTime }}</span>
          <span class="pomodoro__task" v-if="activeTodo">{{ activeTodo.title }}</span>
          <button class="btn pomodoro__stop" type="button" @click="pomodoroStore.stop()">
            <font-awesome-icon icon="stop" />
          </button>
        </div>
      </section>
      <section class="content">
        <div>
          <div class="todoList">
            <TodoList
              v-for="item in filteredTodos"
              :key="item.id"
              :item="item"
              @remove-todo="removeTodo"
              @edit-todo="editTodo"
              @mark-todo="markTodos"
            ></TodoList>
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
              <p class="title text-left">Due date:</p>
              <input class="form-control" type="date" v-model="cacheDueDate" />
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

.app-todo .pomodoro {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }

  &__phase {
    font-size: 0.85rem;

    &--break {
      color: #00a916;
    }
  }

  &__time {
    font-size: 1.4rem;
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    color: #4a4a4a;
  }

  &__task {
    max-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.85rem;
    color: #9b9b9b;
  }

  &__stop {
    color: #ff3f3f;
    opacity: 0.7;
    padding: 0.25rem 0.5rem;

    &:hover {
      opacity: 1;
    }
  }
}

.app-todo .list-group-item .btn-pomodoro {
  &.running {
    color: #ff3f3f;
    opacity: 1;
  }
}

.app-todo .noteArea .tomato-count {
  font-size: inherit;
}

.app-todo .noteArea .due-date.overdue {
  color: #ff3f3f;
  font-weight: bold;
}
</style>

<script>
import moment from "moment";
import { mapState } from "pinia";
import TodoList from "@/components/TodoList.vue";
import { useTodoStore } from "@/stores/todo";
import { usePomodoroStore } from "@/stores/pomodoro";

export default {
  name: "Todo",
  components: { TodoList },
  setup() {
    const todoStore = useTodoStore();
    const pomodoroStore = usePomodoroStore();
    return { todoStore, pomodoroStore };
  },
  data() {
    return {
      newTodo: "",
      cacheTodoTitle: "",
      cacheDueDate: "",
      commentText: "",
      day: moment().format("DD"),
      year: moment().format("YYYY"),
      month: moment().format("MMM"),
      currentWeek: moment().format("ddd"),
      timeMessage: moment().format("LTS"),
      clockTimer: null
    };
  },
  computed: {
    ...mapState(useTodoStore, ["filter", "filteredTodos", "editingTodo"]),
    ...mapState(usePomodoroStore, {
      pomodoroMode: "mode",
      phase: "phase",
      isRunning: "isRunning",
      displayTime: "displayTime",
      activeTodo: "activeTodo"
    })
  },
  methods: {
    addTodo() {
      this.todoStore.addTodo(this.newTodo.trim());
      this.newTodo = "";
    },
    updateCurrentTime() {
      this.timeMessage = moment().format("LTS");
    },
    cancelEdit() {
      this.todoStore.stopEdit();
      this.cacheTodoTitle = "";
      this.cacheDueDate = "";
    },
    removeTodo(item) {
      this.todoStore.removeTodo(item);
    },
    editTodo(item) {
      this.todoStore.startEdit(item);
      this.cacheTodoTitle = item.title;
      this.cacheDueDate = item.dueDate || "";
    },
    doneEdit() {
      if (!this.editingTodo) return;
      if (this.cacheTodoTitle) {
        this.todoStore.updateTitle(this.editingTodo, this.cacheTodoTitle);
      }
      this.todoStore.setDueDate(this.editingTodo, this.cacheDueDate);
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
  created() {
    this.timeMessage = moment().format("LTS");
    this.clockTimer = setInterval(() => this.updateCurrentTime(), 1 * 1000);
  },
  beforeUnmount() {
    clearInterval(this.clockTimer);
  }
};
</script>
