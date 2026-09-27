import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore, today, STORAGE_KEY, SORT_KEY, SINK_KEY } from '@/stores/todo'

const titles = (list) => list.map((t) => t.title)

function seed (todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  setActivePinia(createPinia())
  return useTodoStore()
}

describe('todo store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('loading & migration', () => {
    it('falls back to the default todos when storage is empty', () => {
      const store = useTodoStore()
      expect(titles(store.todos)).toEqual(['要買蘿蔔', '冷萃咖啡'])
      expect(store.todos.every((t) => typeof t.order === 'number')).toBe(true)
    })

    it('falls back to the defaults when storage is corrupted', () => {
      localStorage.setItem(STORAGE_KEY, '{not json')
      setActivePinia(createPinia())
      expect(useTodoStore().todos).toHaveLength(2)
    })

    it('gives old todos an order from their array position and merges dueDate into date', () => {
      const store = seed([
        { id: 5, title: 'a', completed: false },
        { id: 6, title: 'b', completed: false, dueDate: '2020-01-02' },
        { id: 7, title: 'c', completed: false, date: '2020-01-03', order: 42 }
      ])
      expect(store.todos.map((t) => t.order)).toEqual([0, 1, 42])
      expect(store.todos[0].date).toBe(today())
      expect(store.todos[1].date).toBe('2020-01-02')
      expect('dueDate' in store.todos[1]).toBe(false)
    })

    it('ignores an unknown saved sort mode', () => {
      localStorage.setItem(SORT_KEY, 'bogus')
      setActivePinia(createPinia())
      expect(useTodoStore().sortMode).toBe('manual')
    })
  })

  describe('adding and moving', () => {
    it('puts a new task at the top of its day', () => {
      const store = seed([])
      store.addTodo('first', '2030-01-01')
      store.addTodo('second', '2030-01-01')
      expect(titles(store.sortedOn('2030-01-01'))).toEqual(['second', 'first'])
    })

    it('ignores an empty title', () => {
      const store = seed([])
      store.addTodo('', '2030-01-01')
      expect(store.todos).toHaveLength(0)
    })

    it('moves a task to the top of another day', () => {
      const store = seed([
        { id: 1, title: 'x', date: '2030-01-01', order: 0 },
        { id: 2, title: 'y', date: '2030-01-02', order: 0 },
        { id: 3, title: 'z', date: '2030-01-02', order: 1 }
      ])
      store.moveTodo(store.todos[0], '2030-01-02')
      expect(titles(store.sortedOn('2030-01-02'))).toEqual(['x', 'y', 'z'])
    })

    it('does nothing when moving to the same day or to no day', () => {
      const store = seed([{ id: 1, title: 'x', date: '2030-01-01', order: 7 }])
      store.moveTodo(store.todos[0], '2030-01-01')
      store.moveTodo(store.todos[0], '')
      expect(store.todos[0]).toMatchObject({ date: '2030-01-01', order: 7 })
    })
  })

  describe('reorder (drag & drop)', () => {
    const day = '2030-01-01'
    const fourTasks = () => seed([
      { id: 1, title: 'a', date: day, order: 0 },
      { id: 2, title: 'b', date: day, order: 1 },
      { id: 3, title: 'c', date: day, order: 2 },
      { id: 4, title: 'd', date: day, order: 3 },
      { id: 9, title: 'other day', date: '2030-01-02', order: 0 }
    ])

    it('moves an item down into the target slot', () => {
      const store = fourTasks()
      store.reorder(1, 3)
      expect(titles(store.sortedOn(day))).toEqual(['b', 'c', 'a', 'd'])
    })

    it('moves an item up into the target slot', () => {
      const store = fourTasks()
      store.reorder(4, 2)
      expect(titles(store.sortedOn(day))).toEqual(['a', 'd', 'b', 'c'])
    })

    it('renumbers orders 0..n-1 so repeated drags stay stable', () => {
      const store = fourTasks()
      store.reorder(1, 4)
      store.reorder(4, 1)
      expect(store.todosOn(day).map((t) => t.order).sort()).toEqual([0, 1, 2, 3])
      expect(titles(store.sortedOn(day))).toEqual(['b', 'c', 'a', 'd'])
    })

    it.each([
      ['same item', 1, 1],
      ['unknown drag id', 99, 1],
      ['unknown target id', 1, 99],
      ['target on another day', 1, 9]
    ])('is a no-op for %s', (_, from, to) => {
      const store = fourTasks()
      store.reorder(from, to)
      expect(titles(store.sortedOn(day))).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('sorting', () => {
    const day = '2030-01-01'
    const mixed = () => seed([
      { id: 1, title: 'plain', date: day, order: 0, completed: false },
      { id: 2, title: 'done-starred', date: day, order: 1, completed: true, marked: true },
      { id: 3, title: 'starred', date: day, order: 2, completed: false, marked: true },
      { id: 4, title: 'tomatoes', date: day, order: 3, completed: false, tomatoes: 3 }
    ])

    it('manual mode sinks completed tasks by default', () => {
      expect(titles(mixed().sortedOn(day))).toEqual(['plain', 'starred', 'tomatoes', 'done-starred'])
    })

    it('manual mode keeps the raw order when sinking is off', () => {
      const store = mixed()
      store.toggleSinkDone()
      expect(titles(store.sortedOn(day))).toEqual(['plain', 'done-starred', 'starred', 'tomatoes'])
    })

    it('star mode puts starred tasks first', () => {
      const store = mixed()
      store.setSortMode('star')
      expect(titles(store.sortedOn(day))).toEqual(['starred', 'plain', 'tomatoes', 'done-starred'])
    })

    it('tomato mode puts the most tomatoes first', () => {
      const store = mixed()
      store.setSortMode('tomato')
      expect(titles(store.sortedOn(day))[0]).toBe('tomatoes')
    })

    it('newest mode sorts by id descending', () => {
      const store = mixed()
      store.setSortMode('newest')
      store.toggleSinkDone()
      expect(titles(store.sortedOn(day))).toEqual(['tomatoes', 'starred', 'done-starred', 'plain'])
    })

    it('combines with the done/todo filter', () => {
      const store = mixed()
      store.setFilter('done')
      expect(titles(store.sortedOn(day))).toEqual(['done-starred'])
      store.setFilter('todo')
      expect(titles(store.sortedOn(day))).toHaveLength(3)
    })

    it('persists sort mode and sink toggle, and rejects unknown modes', () => {
      const store = mixed()
      store.setSortMode('star')
      store.setSortMode('nope')
      store.toggleSinkDone()
      expect(store.sortMode).toBe('star')
      expect(localStorage.getItem(SORT_KEY)).toBe('star')
      expect(localStorage.getItem(SINK_KEY)).toBe('0')
      setActivePinia(createPinia())
      const reloaded = useTodoStore()
      expect(reloaded.sortMode).toBe('star')
      expect(reloaded.sinkDone).toBe(false)
    })
  })

  it('statsOn counts done tasks and tomatoes for a day', () => {
    const store = seed([
      { id: 1, title: 'a', date: '2030-01-01', completed: true, tomatoes: 2 },
      { id: 2, title: 'b', date: '2030-01-01', completed: false, tomatoes: 1 },
      { id: 3, title: 'c', date: '2030-01-02', completed: true }
    ])
    expect(store.statsOn('2030-01-01')).toEqual({ total: 2, done: 1, tomatoes: 3 })
    expect(store.statsOn('1999-01-01')).toEqual({ total: 0, done: 0, tomatoes: 0 })
  })
})
