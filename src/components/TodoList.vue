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
        </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'TodoList',
  props: ['item'],
  emits: ['cancel-edit', 'remove-todo', 'edit-todo', 'done-edit', 'delete-todo', 'mark-todo'],
  methods: {
    cancelEdit (item) {
      this.$emit('cancel-edit', item)
    },
    removeTodo (item) {
      this.$emit('remove-todo', item)
    },
    editTodo (item) {
      this.$emit('edit-todo', item)
    },
    doneEdit (item) {
      this.$emit('done-edit', item)
    },
    deleteTodos (item) {
      this.$emit('delete-todo', item)
    },
    markTodos (item) {
      this.$emit('mark-todo', item)
    }
  }
}
</script>
