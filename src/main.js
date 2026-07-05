import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCircle, faMobileAlt, faEnvelope, faEllipsisH, faTrashAlt,
  faStar, faFileAlt, faCalendarAlt, faEdit
} from '@fortawesome/free-solid-svg-icons'
import {
  faCalendarCheck, faCommentDots
} from '@fortawesome/free-regular-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import App from './App.vue'
import router from './router'
import { useTodoStore, STORAGE_KEY } from './stores/todo'
import 'bootstrap' // Import js file
import 'bootstrap/dist/css/bootstrap.min.css' // Import css file

library.add(
  faCalendarCheck, faCommentDots, faCircle, faMobileAlt, faEnvelope, faGithub, faEllipsisH,
  faTrashAlt, faStar, faFileAlt, faCalendarAlt, faEdit
)

const app = createApp(App)
const pinia = createPinia()

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(pinia)
app.use(router)

// persist todos on every store change (including nested item edits)
const todoStore = useTodoStore(pinia)
todoStore.$subscribe((mutation, state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos))
})

app.mount('#app')
