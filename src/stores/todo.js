import { defineStore } from 'pinia'
import moment from 'moment'

export const STORAGE_KEY = 'todos-vuejs'

export function today () {
  return moment().format('YYYY-MM-DD')
}

function defaultTodos () {
  return [
    {
      id: 0,
      title: '要買蘿蔔',
      completed: false,
      marked: false,
      date: today(),
      messageDate: '05/02/2019 10:00 AM',
      comments: ['6:00pm', 'the new restaurant']
    },
    {
      id: 1,
      title: '冷萃咖啡',
      completed: true,
      marked: true,
      date: today(),
      comments: [],
      messageDate: '03/22/2019 08:23 AM'
    }
  ]
}

function loadTodos () {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const todos = JSON.parse(saved)
      // 遷移:沒有 date 的舊資料 → 用 dueDate,沒有就歸到今天(dueDate 併入 date)
      todos.forEach((todo) => {
        if (!todo.date) {
          todo.date = todo.dueDate || today()
        }
        delete todo.dueDate
      })
      return todos
    }
  } catch (e) {
    // corrupted storage — fall back to the defaults
  }
  return defaultTodos()
}

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: loadTodos(),
    filter: 'all', // 'all' | 'done' | 'todo'
    viewDate: today(), // 目前檢視中的日子(卡片、行事曆、新增預設共用)
    editingTodo: null // the todo currently open in the edit modal
  }),
  getters: {
    todosOn: (state) => (date) => state.todos.filter((todo) => todo.date === date),
    // 依目前 filter 過濾某一天的清單
    visibleOn () {
      return (date) => {
        const list = this.todosOn(date)
        if (this.filter === 'done') return list.filter((t) => t.completed)
        if (this.filter === 'todo') return list.filter((t) => !t.completed)
        return list
      }
    },
    // 行事曆小點用:date → { total, open, late }
    countsByDate: (state) => {
      const t = today()
      const map = {}
      state.todos.forEach((todo) => {
        const c = map[todo.date] || (map[todo.date] = { total: 0, open: 0, late: 0 })
        c.total += 1
        if (!todo.completed) {
          c.open += 1
          if (todo.date < t) c.late += 1
        }
      })
      return map
    },
    overdueTodos: (state) => state.todos.filter((todo) => !todo.completed && todo.date < today()),
    latestOverdueDate () {
      return this.overdueTodos.reduce((max, t) => (t.date > max ? t.date : max), '') || null
    }
  },
  actions: {
    setFilter (filter) {
      this.filter = filter
    },
    setViewDate (date) {
      if (date) this.viewDate = date
    },
    startEdit (item) {
      this.editingTodo = item
    },
    stopEdit () {
      this.editingTodo = null
    },
    addTodo (title, date) {
      if (!title) return
      const nextId = this.todos.reduce((max, todo) => Math.max(max, todo.id || 0), -1) + 1
      this.todos.unshift({
        id: nextId,
        title,
        completed: false,
        marked: false,
        comments: [],
        date: date || this.viewDate || today(),
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
    // 把任務移到另一天(逾期任務的「移到別天」也走這裡)
    moveTodo (item, date) {
      if (date) item.date = date
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
