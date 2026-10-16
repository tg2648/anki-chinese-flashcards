import { createApp } from 'vue'
import App from './App.vue'
import { loadDict } from './cards'

createApp(App).mount('#app')
loadDict()
