import { createRouter, createWebHistory } from "vue-router";

import Index from '../page/Index.vue'
import Product from "../page/Product.vue";
import Detail from "../page/Detail.vue";
import ProductAdmin from "../page/AdminPage/ProductAdmin.vue";
import Category from "../page/AdminPage/Category.vue";
import Users from "../page/AdminPage/Users.vue";
import Cart from "../page/Cart.vue";
import Login from "../page/Login.vue";
import Register from "../page/Register.vue";
import ForgotPassword from "../page/ForgotPassword.vue";
import PermissionDenied from "../page/503.vue"
import Profile from "../page/Profile.vue";
import Checkout from "../page/Checkout.vue";
import AdminOrders from "../page/AdminPage/AdminOrders.vue";
import OrderHistory from "../page/OrderHistory.vue";
import DashboardStats from "../page/AdminPage/DashboardStats.vue";
import FavoritesPage from "../page/FavoritesPage.vue";
import ReviewManager from "../page/AdminPage/ReviewManager.vue";

const routes = [
    { path: '/', name: 'index', component: Index },

    { path: '/product', name: 'product', component: Product },
    { path: '/product/:id', name: 'detail', component: Detail },

    // ADMIN PAGE
    { path: '/productAdmin', name: 'productAdmin', component: ProductAdmin, meta: { requiresAuth: true, isAdmin: true } },
    { path: '/category', name: 'category', component: Category, meta: { requiresAuth: true, isAdmin: true } },
    { path: '/user', name: 'user', component: Users, meta: { requiresAuth: true, isAdmin: true } },
    { path: '/admin-order', name: 'admin-order', component: AdminOrders, meta: { requiresAuth: true, isAdmin: true } },
    { path: '/dashboard-stats', name: 'dashboard-stats', component: DashboardStats, meta: { requiresAuth: true, isAdmin: true } },
    { path: '/review-manager', name: 'review-manager', component: ReviewManager, meta: { requiresAuth: true, isAdmin: true } },

    // USER PAGE
    { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/cart', name: 'cart', component: Cart, meta: { requiresAuth: true } },
    { path: '/checkout', name: 'checkout', component: Checkout, meta: { requiresAuth: true } },
    { path: '/order-history', name: 'order-history', component: OrderHistory, meta: { requiresAuth: true } },
    { path: '/favorites-page', name: 'favorites-page', component: FavoritesPage, meta: { requiresAuth: true } },

    // LOGIN 
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: Register },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPassword},

    // PAGE CHẶN QUYỀN
    { path: "/503", name: "permissionDenied", component: PermissionDenied }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const user = localStorage.getItem('ketqua')

    if (to.meta.requiresAuth && !user) {
        return next({ name: "login" })
    }

    const userParse = JSON.parse(user)

    if (to.meta.isAdmin && userParse.role != "admin") {
        return next({ name: "permissionDenied" })
    }

    next()
})
export default router