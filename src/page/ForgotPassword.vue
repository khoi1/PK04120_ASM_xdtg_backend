<script setup>
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const email = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const step = ref(1); // 1 = nhập email, 2 = đổi mật khẩu
const error = ref("");
const otpInput = ref("");

const BASE_URL = import.meta.env.VITE_API_URL;
let foundUser = null;
let generatedOtp = null;

const handleCheckEmail = async () => {
  error.value = "";

  if (!email.value) {
    error.value = "Vui lòng nhập email!";
    return;
  }

  try {
    const res = await axios.get(`${BASE_URL}/users?username=${email.value}`);

    if (res.data.length === 0) {
      error.value = "Email không tồn tại!";
      return;
    }

    foundUser = res.data[0];
    generatedOtp = Math.floor(100000 + Math.random() * 900000);
    console.log("OTP của bạn là:", generatedOtp);

    step.value = 2;
  } catch (e) {
    console.error(e);
    error.value = "Không thể kết nối server!";
  }
};

const handleVerifyOtp = () => {
  error.value = "";

  if (!otpInput.value) {
    error.value = "Vui lòng nhập OTP!";
    return;
  }

  if (parseInt(otpInput.value) !== generatedOtp) {
    error.value = "OTP không đúng!";
    return;
  }

  step.value = 3;
};

const handleResetPassword = async () => {
  error.value = "";

  if (!newPassword.value || !confirmPassword.value) {
    error.value = "Vui lòng nhập đầy đủ mật khẩu!";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = "Mật khẩu nhập lại không khớp!";
    return;
  }

  try {

    await axios.patch(`${BASE_URL}/users/${foundUser.id}`, {
      password: newPassword.value,
    });

    alert("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");

    router.push("/login");
  } catch (e) {
    console.error(e);
    error.value = "Lỗi server! Không thể đổi mật khẩu.";
  }
};
</script>

<template>
  <div class="container d-flex justify-content-center align-items-center p-5">
    <div class="card shadow p-4" style="width: 420px;">

      <h3 class="text-center mb-3">Quên mật khẩu</h3>

      <p class="text-danger text-center">{{ error }}</p>

      <div v-if="step === 1">
        <div class="form-group mb-3">
          <label class="form-label">Nhập email tài khoản</label>
          <input v-model="email" type="email" class="form-control" placeholder="Email đã đăng ký" />
        </div>

        <button @click="handleCheckEmail" class="btn btn-primary w-100">
          Tiếp tục
        </button>

        <router-link to="/login" class="btn btn-secondary w-100 mt-2">
          Quay lại đăng nhập
        </router-link>
      </div>

      <div v-if="step === 2">
        <p class="text-center text-muted">Một mã OTP đã được gửi (giả lập). Kiểm tra console.</p>

        <div class="form-group mb-3">
          <label class="form-label">Nhập OTP</label>
          <input v-model="otpInput" type="text" class="form-control" placeholder="6 số" />
        </div>

        <button @click="handleVerifyOtp" class="btn btn-primary w-100">Xác nhận OTP</button>

        <router-link to="/login" class="btn btn-secondary w-100 mt-2">Hủy</router-link>
      </div>

      <!-- STEP 3: Reset password -->
      <div v-if="step === 3">
        <div class="form-group mb-3">
          <label class="form-label">Mật khẩu mới</label>
          <input v-model="newPassword" type="password" class="form-control" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Nhập lại mật khẩu</label>
          <input v-model="confirmPassword" type="password" class="form-control" />
        </div>

        <button @click="handleResetPassword" class="btn btn-success w-100">Đặt lại mật khẩu</button>

        <router-link to="/login" class="btn btn-secondary w-100 mt-2">Hủy</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
