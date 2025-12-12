<script setup>
import { onMounted, provide, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()

const share = reactive({
  user: {},    
  carts: []  
});

provide('share', share)


onMounted(() => {
  const currentUser = localStorage.getItem('ketqua')
  if (!currentUser) return

  Object.assign(share.user, JSON.parse(currentUser))
})

const handleLogout = () => {
  localStorage.removeItem('ketqua')

  Object.keys(share.user).forEach(k => delete share.user[k])

  share.carts.length = 0

  router.push('/login')
}
</script>

<template>

  <nav class="navbar navbar-expand-lg bg-light fixed-top">
    <div class="container">

      <router-link class="navbar-brand fw-bold" to="/">MyStore</router-link>

      <div class="collapse navbar-collapse justify-content-end">
        <ul class="navbar-nav">

          <li class="nav-item">
            <router-link class="nav-link fw-bold" to="/">Trang chủ</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link fw-bold" to="/product">Sản phẩm</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link fw-bold" to="/cart">Giỏ hàng</router-link>
          </li>

          <!-- ADMIN -->
          <li class="nav-item dropdown" v-if="share.user.role === 'admin'">
            <a href="#" class="nav-link dropdown-toggle fw-bold" role="button" data-bs-toggle="dropdown">
              Quản lý
            </a>

            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <router-link class="dropdown-item" to="/productAdmin">Quản lý sản phẩm</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/category">Quản lý danh mục</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/user">Quản lý người dùng</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/admin-order">Quản lý đơn hàng</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/dashboard-stats">Thống kê</router-link>
              </li>
            </ul>
          </li>

          <!-- USER -->
          <li class="nav-item dropdown" v-if="share.user.fullname">
            <a href="#" class="nav-link dropdown-toggle fw-bold" role="button" data-bs-toggle="dropdown">
              Xin chào, {{ share.user.fullname }}
            </a>

            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <router-link class="dropdown-item" to="/profile">Thông tin tài khoản</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/favorites-page">Sản phẩm yêu thích</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/order-history">Lịch sử đơn hàng</router-link>
              </li>
              <li>
                <button class="dropdown-item text-danger" @click="handleLogout()">Đăng xuất</button>
              </li>
            </ul>
          </li>

          <li class="nav-item" v-else>
            <router-link class="nav-link" to="/login">Đăng nhập</router-link>
          </li>

        </ul>
      </div>
    </div>
  </nav>

  <div style="margin-top: 60px;">
    <router-view></router-view>
  </div>

  <footer class="bg-dark text-light mt-5 py-5 border-top border-secondary">
    <div class="container">
      <div class="row">
        <div class="col-md-4 mb-4">
          <h5 class="fw-bold text-uppercase text-warning mb-3">MyStore</h5>
          <p class="text-secondary small">
            Nơi hội tụ những món đồ công nghệ "chất lừ" dành cho Gen Z. 
            Uy tín, chất lượng và luôn bắt trend nhanh nhất hệ mặt trời.
          </p>
          <div class="d-flex gap-3">
            <a href="#" class="text-light fs-5"><i class="bi bi-facebook"></i></a>
            <a href="#" class="text-light fs-5"><i class="bi bi-instagram"></i></a>
            <a href="#" class="text-light fs-5"><i class="bi bi-tiktok"></i></a>
            <a href="#" class="text-light fs-5"><i class="bi bi-youtube"></i></a>
          </div>
        </div>

        <div class="col-md-4 mb-4">
          <h5 class="fw-bold text-uppercase text-warning mb-3">Hỗ trợ khách hàng</h5>
          <ul class="list-unstyled text-secondary">
            <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Hướng dẫn mua hàng</a></li>
            <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Chính sách bảo hành</a></li>
            <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Vận chuyển & Giao nhận</a></li>
            <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Liên hệ hỗ trợ</a></li>
          </ul>
        </div>

        <div class="col-md-4 mb-4">
          <h5 class="fw-bold text-uppercase text-warning mb-3">Liên hệ</h5>
          <ul class="list-unstyled text-secondary small">
            <li class="mb-3 d-flex">
              <i class="bi bi-geo-alt-fill me-2 text-warning"></i> 
              <span>118 Nguyễn Văn Cừ, Buôn Ma Thuột, Đăk Lăk</span>
            </li>
            <li class="mb-3 d-flex">
              <i class="bi bi-envelope-fill me-2 text-warning"></i> 
              <span>nguyentannhatkhoi@gmail.com</span>
            </li>
            <li class="mb-3 d-flex">
              <i class="bi bi-telephone-fill me-2 text-warning"></i> 
              <span>098 971 5747</span>
            </li>
          </ul>
        </div>
      </div>

      <hr class="border-secondary my-4">

      <div class="row align-items-center">
        <div class="col-md-6 text-center text-md-start">
          <p class="mb-0 text-secondary small">
            © 2025 Copyright by <strong class="text-white">FPT Polytechnic</strong>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>
