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
      <section class="content">
        <div>
          <div class="todoList">
            <TodoList
              v-for="item in filteredTodos"
              :key="item.id"
              :item="item"
              @cancel-edit="cancelEdit"
              @remove-todo="removeTodo"
              @edit-todo="editTodo"
              @done-edit="doneEdit"
              @delete-todo="deleteTodos"
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
                v-for="(data, index) in cacheTodo.comments"
                :key="index"
                :class="{ 'border-bottom': index !== cacheTodo.comments.length - 1 }"
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
</style>

<script>
import moment from "moment";
import { mapState } from "pinia";
import TodoList from "@/components/TodoList.vue";
import { useTodoStore } from "@/stores/todo";

export default {
  name: "Todo",
  components: { TodoList },
  setup() {
    const todoStore = useTodoStore();
    return { todoStore };
  },
  data() {
    return {
      newTodo: "",
      cacheTodo: {},
      cacheTodoTitle: "",
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
    ...mapState(useTodoStore, ["filter", "filteredTodos", "remaining"])
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
      this.cacheTodo = {};
      this.cacheTodoTitle = "";
    },
    removeTodo(item) {
      this.todoStore.removeTodo(item);
    },
    editTodo(item) {
      this.cacheTodo = item;
      this.cacheTodoTitle = item.title;
    },
    doneEdit() {
      if (this.cacheTodo.id !== undefined && this.cacheTodoTitle) {
        this.todoStore.updateTitle(this.cacheTodo, this.cacheTodoTitle);
      }
    },
    deleteTodos() {
      this.todoStore.clearTodos();
    },
    markTodos(item) {
      this.todoStore.toggleMark(item);
    },
    addComment() {
      this.todoStore.addComment(this.cacheTodo, this.commentText);
      this.commentText = "";
    },
    removeComment(index) {
      this.todoStore.removeComment(this.cacheTodo, index);
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
