<script setup>
import axios from 'axios';
import { inject, reactive } from 'vue';
import { onMounted, ref } from 'vue';

const products = ref([]);
const share = inject('share')

const BASE_URL = import.meta.env.VITE_API_URL;

const profileForm = reactive({
  email: share?.user.username || '',
  fullname: share?.user.fullname || '',
  age: share?.user.age || '',
  gender: share?.user.gender || '',
  desiredProduct: share?.user.desiredProduct || ''
});

onMounted(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/products`);
    products.value = res.data;
  } catch (err) {
    console.error(err);
  }
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  newPasswordConfirm: ''
});
const updateProfile = async () => {
  try {
    const userLocal = JSON.parse(localStorage.getItem("ketqua"));

    if (!userLocal) {
      alert("Bạn chưa đăng nhập!");
      return;
    }
    const age = Number(profileForm.age);

    if (isNaN(age)) {
      alert("Tuổi phải là số!");
      return;
    }

    if (age < 1) {
      alert("Tuổi phải lớn hơn hoặc bằng 1!");
      return;
    }

    if (age > 120) {
      alert("Tuổi không hợp lệ (quá lớn)!");
      return;
    }
    const updatedUser = {
      ...userLocal,
      fullname: profileForm.fullname,
      age: profileForm.age,
      gender: profileForm.gender,
      desiredProduct: profileForm.desiredProduct
    };

    const response = await axios.put(
      `${BASE_URL}/users/${userLocal.id}`,
      updatedUser
    );

    if (response.status === 200) {
      alert("Cập nhật thông tin thành công!");

      localStorage.setItem("ketqua", JSON.stringify(updatedUser));

      if (share.user) {
        Object.assign(share, updatedUser);
      }
    }
  } catch (error) {
    console.error(error);
    alert("Không thể cập nhật thông tin tài khoản!");
  }
};
const changePassword = async () => {
  try {
    const userLocal = JSON.parse(localStorage.getItem("ketqua"));

    if (!userLocal) {
      alert("Bạn chưa đăng nhập!");
      return;
    }

    if (passwordForm.oldPassword !== userLocal.password) {
      alert("Mật khẩu cũ không đúng!");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      alert("Mật khẩu mới nhập lại không khớp!");
      return;
    }

    if (passwordForm.newPassword === userLocal.password) {
      alert("Mật khẩu mới phải khác mật khẩu cũ!");
      return;
    }

    const updatedUser = {
      ...userLocal,
      password: passwordForm.newPassword
    };

    const response = await axios.patch(`${BASE_URL}/users/${userLocal.id}`, {
      password: passwordForm.newPassword
    });

    if (response.status === 200) {
      alert("Đổi mật khẩu thành công!");

      localStorage.setItem("ketqua", JSON.stringify(updatedUser));
      Object.assign(share.user, updatedUser);

      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.newPasswordConfirm = '';
    }
  } catch (error) {
    console.error(error);
    alert("Không thể đổi mật khẩu!");
  }
};
</script>

<template>
  <div class="container py-4">
    <div class="row g-4 card shadow-sm w-50 mx-auto">
      <div class="col-md-12 card-body">
        <h2>Đổi thông tin tài khoản</h2>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="text" class="form-control" v-model="profileForm.email" disabled />
        </div>

        <div class="mb-3">
          <label class="form-label">Họ tên</label>
          <input type="text" class="form-control" v-model="profileForm.fullname" />
        </div>

        <div class="mb-3">
          <label class="form-label">Tuổi</label>
          <input type="number" class="form-control" v-model="profileForm.age" />
        </div>

        <div class="mb-3">
          <label class="form-label">Giới tính</label>
          <select class="form-select" v-model="profileForm.gender">
            <option value="">-- Chọn giới tính --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Sản phẩm mong muốn</label>
          <select class="form-select" v-model="profileForm.desiredProduct">
            <option value="">-- Chọn sản phẩm --</option>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>

        <button class="btn btn-primary w-25" @click="updateProfile">
          Lưu thay đổi
        </button>
      </div>
    </div>
    <div class="row mt-5 g-4 card shadow-sm w-50 mx-auto">
      <div class="col-md-12 card-body">
        <h2>Đổi mật khẩu</h2>
        <div class="mb-3">
          <label class="form-label">Mật khẩu cũ</label>
          <input type="text" v-model="passwordForm.oldPassword" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Mật khẩu mới</label>
          <input type="text" v-model="passwordForm.newPassword" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Nhập lại mật khẩu mới</label>
          <input type="text" v-model="passwordForm.newPasswordConfirm" class="form-control" />
        </div>

        <button class="btn btn-primary w-25" @click="changePassword">
          Lưu thay đổi
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>