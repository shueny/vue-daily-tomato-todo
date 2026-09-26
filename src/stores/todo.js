import { defineStore } from 'pinia'
import moment from 'moment'

export const STORAGE_KEY = 'todos-vuejs'
export const SORT_KEY = 'todo-sort'
export const SINK_KEY = 'todo-sink-done'

// 排序模式:自訂(拖曳)、重要優先、番茄最多、最新建立
export const SORT_MODES = ['manual', 'star', 'tomato', 'newest']

function loadSortMode () {
  const saved = localStorage.getItem(SORT_KEY)
  return SORT_MODES.includes(saved) ? saved : 'manual'
}

const byOrder = (a, b) => (a.order || 0) - (b.order || 0)

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
      order: 0,
      date: today(),
      messageDate: '05/02/2019 10:00 AM',
      comments: ['6:00pm', 'the new restaurant']
    },
    {
      id: 1,
      title: '冷萃咖啡',
      completed: true,
      marked: true,
      order: 1,
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
      todos.forEach((todo, index) => {
        // 遷移:沒有 order 的舊資料 → 依陣列位置排(原本新任務在最前面)
        if (typeof todo.order !== 'number') {
          todo.order = index
        }
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
    sortMode: loadSortMode(),
    sinkDone: localStorage.getItem(SINK_KEY) !== '0', // 已完成的沉到底部
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
    // 過濾後再依排序模式排好,畫面上的清單就是這個
    sortedOn () {
      return (date) => {
        const mode = this.sortMode
        let cmp = byOrder
        if (mode === 'star') cmp = (a, b) => (b.marked ? 1 : 0) - (a.marked ? 1 : 0) || byOrder(a, b)
        if (mode === 'tomato') cmp = (a, b) => (b.tomatoes || 0) - (a.tomatoes || 0) || byOrder(a, b)
        if (mode === 'newest') cmp = (a, b) => (b.id || 0) - (a.id || 0)
        const sink = this.sinkDone
        return [...this.visibleOn(date)].sort(
          (a, b) => (sink ? (a.completed ? 1 : 0) - (b.completed ? 1 : 0) : 0) || cmp(a, b)
        )
      }
    },
    // 某天的小統計:完成數、總數、蕃茄數
    statsOn: (state) => (date) => {
      const list = state.todos.filter((todo) => todo.date === date)
      return {
        total: list.length,
        done: list.filter((t) => t.completed).length,
        tomatoes: list.reduce((sum, t) => sum + (t.tomatoes || 0), 0)
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
    setSortMode (mode) {
      if (!SORT_MODES.includes(mode)) return
      this.sortMode = mode
      localStorage.setItem(SORT_KEY, mode)
    },
    toggleSinkDone () {
      this.sinkDone = !this.sinkDone
      localStorage.setItem(SINK_KEY, this.sinkDone ? '1' : '0')
    },
    // 某天最上面的位置(新任務、搬過來的任務放這裡)
    topOrder (date, except) {
      const orders = this.todos
        .filter((t) => t.date === date && t !== except)
        .map((t) => t.order || 0)
      return orders.length ? Math.min(...orders) - 1 : 0
    },
    // 拖曳排序:把 dragId 放到 targetId 的位置,整天重新編號
    reorder (dragId, targetId) {
      const drag = this.todos.find((t) => t.id === dragId)
      const target = this.todos.find((t) => t.id === targetId)
      if (!drag || !target || drag === target || drag.date !== target.date) return
      const list = this.todos.filter((t) => t.date === drag.date).sort(byOrder)
      const to = list.indexOf(target)
      list.splice(list.indexOf(drag), 1)
      list.splice(to, 0, drag)
      list.forEach((t, i) => {
        t.order = i
      })
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
        order: this.topOrder(date || this.viewDate || today()),
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
      if (!date || date === item.date) return
      item.order = this.topOrder(date, item)
      item.date = date
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
