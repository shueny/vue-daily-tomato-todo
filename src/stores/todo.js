import { defineStore } from 'pinia'
import moment from 'moment'

export const STORAGE_KEY = 'todos-vuejs'

const defaultTodos = [
  {
    id: 0,
    title: '要買蘿蔔',
    completed: false,
    marked: false,
    messageDate: '05/02/2019 10:00 AM',
    comments: ['6:00pm', 'the new restaurant']
  },
  {
    id: 1,
    title: '冷萃咖啡',
    completed: true,
    marked: true,
    comments: [],
    messageDate: '03/22/2019 08:23 AM'
  }
]

function loadTodos () {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    // corrupted storage — fall back to the defaults
  }
  return defaultTodos
}

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: loadTodos(),
    filter: 'all', // 'all' | 'done' | 'todo'
    editingTodo: null // the todo currently open in the edit modal
  }),
  getters: {
    allTodos: (state) => state.todos,
    doneTodos: (state) => state.todos.filter((todo) => todo.completed),
    undoneTodos: (state) => state.todos.filter((todo) => !todo.completed),
    filteredTodos () {
      if (this.filter === 'done') return this.doneTodos
      if (this.filter === 'todo') return this.undoneTodos
      return this.allTodos
    }
  },
  actions: {
    setFilter (filter) {
      this.filter = filter
    },
    startEdit (item) {
      this.editingTodo = item
    },
    stopEdit () {
      this.editingTodo = null
    },
    addTodo (title) {
      if (!title) return
      const nextId = this.todos.reduce((max, todo) => Math.max(max, todo.id || 0), -1) + 1
      this.todos.unshift({
        id: nextId,
        title,
        completed: false,
        marked: false,
        comments: [],
        messageDate: `${moment().format('L')} ${moment().format('LT')}`
      })
    },
    removeTodo (item) {
      const delIndex = this.todos.indexOf(item)
      if (delIndex !== -1) {
        this.todos.splice(delIndex, 1)
      }
    },
    toggleMark (item) {
      item.marked = !item.marked
    },
    updateTitle (item, title) {
      item.title = title
    },
    setDueDate (item, dueDate) {
      item.dueDate = dueDate || null
    },
    addTomato (id) {
      const todo = this.todos.find((t) => t.id === id)
      if (todo) {
        todo.tomatoes = (todo.tomatoes || 0) + 1
      }
    },
    addComment (item, text) {
      if (!item || !text) return
      if (!item.comments) {
        item.comments = []
      }
      item.comments.unshift(text)
    },
    removeComment (item, index) {
      item.comments.splice(index, 1)
    }
  }
})
