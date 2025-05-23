import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 모든 컴포넌트 등록
import LoginForm from './components/LoginForm.vue'
import RoomList from './components/RoomList.vue'
import VideoRoom from './components/VideoRoom.vue'

const app = createApp(App)

// 컴포넌트 전역 등록
app.component('LoginForm', LoginForm)
app.component('RoomList', RoomList)
app.component('VideoRoom', VideoRoom)

app.use(createPinia())
app.use(router)

app.mount('#app')
