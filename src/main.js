import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as bootstrap from 'bootstrap'
window.bootstrap = bootstrap


createApp(App).use(router).mount('#app')
