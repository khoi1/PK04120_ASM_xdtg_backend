<script setup>
import axios from "axios";
import { ref, inject } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const share = inject("share");

const fullname = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");

const BASE_URL = import.meta.env.VITE_API_URL;

// Hàm tạo ID tự động kiểu JSON-server
const generateId = () => Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

const handleRegister = async () => {
  error.value = "";

  if (!fullname.value || !email.value || !password.value) {
    error.value = "Vui lòng nhập đầy đủ thông tin!";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Mật khẩu nhập lại không khớp!";
    return;
  }

  try {
    const check = await axios.get(`${BASE_URL}/users?username=${email.value}`);

    if (check.data.length > 0) {
      error.value = "Email này đã được sử dụng!";
      return;
    }

    const newUser = {
      id: generateId(),
      fullname: fullname.value,
      username: email.value,
      password: password.value,
      role: "user",
    };

    await axios.post(`${BASE_URL}/users`, newUser);

    alert("Tạo tài khoản thành công!");

    localStorage.setItem("ketqua", JSON.stringify(newUser));

    if (share) {
      Object.assign(share, newUser);
    }

    router.push("/");
  } catch (err) {
    console.error(err);
    alert("Không thể kết nối server!");
  }
};
</script>

<template>
  <div class="container d-flex justify-content-center align-items-center p-5">
    <div class="card shadow p-4" style="width: 420px;">

      <h3 class="text-center mb-3">Tạo tài khoản mới</h3>

      <div class="form-group">
        <label class="form-label">Họ tên</label>
        <input v-model="fullname" type="text" class="form-control mb-3" placeholder="Nhập họ tên" />
      </div>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-control mb-3" placeholder="Nhập email" />
      </div>

      <div class="form-group">
        <label class="form-label">Mật khẩu</label>
        <input v-model="password" type="password" class="form-control mb-3" placeholder="Mật khẩu" />
      </div>

      <div class="form-group">
        <label class="form-label">Nhập lại mật khẩu</label>
        <input v-model="confirmPassword" type="password" class="form-control mb-3" placeholder="Nhập lại mật khẩu" />
      </div>

      <p class="text-danger text-center">{{ error }}</p>

      <button @click="handleRegister" class="btn btn-success w-100">
        Đăng ký
      </button>
      <router-link class="btn btn-secondary w-100 mt-2" to="/login">
        Quay lại đăng nhập
      </router-link>
    </div>
  </div>
</template>

<style scoped></style>
