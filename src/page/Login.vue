<script setup>
import axios from "axios";
import { inject, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const share = inject('share')

const username = ref("");
const password = ref("");
const error = ref("");

const BASE_URL = import.meta.env.VITE_API_URL;

const handleLogin = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/users?username=${username.value}&password=${password.value}`);
        if (response.status === 200) {
            if (response.data.length > 0) {

                alert("login success");

                const loggedUser = response.data[0];

                localStorage.setItem("ketqua", JSON.stringify(loggedUser));

                if (share.user) {
                    Object.assign(share.user, loggedUser);
                }

                router.push("/");
                return;
            }

            error.value = "Sai tài khoản hoặc mật khẩu!";
        }
    } catch (error) {
        console.error(error);
        alert("Không thể kết nối server!");
    }
};
</script>

<template>
    <div class="container d-flex justify-content-center align-items-center p-5">
        <div class="card shadow p-4" style="width: 400px;">
            <div class="form-group">
                <label class="form-label">Tài khoản</label>
                <input v-model="username" type="text" class="form-control mb-3" placeholder="Tên đăng nhập" />
            </div>
            <div class="form-group">
                <label class="form-label">Mật khẩu</label>
                <input v-model="password" type="password" class="form-control mb-3" placeholder="Mật khẩu" />
            </div>

            <p class="text-danger text-center">{{ error }}</p>

            <button @click="handleLogin()" class="btn btn-primary w-100">
                Đăng nhập
            </button>
            <router-link class="btn btn-secondary w-100 mt-2" to="/">
                Đóng
            </router-link>
            <div class="d-flex justify-content-between mt-2">
                <RouterLink class="nav-link" to="/register">create new account</RouterLink>
                <RouterLink class="nav-link" to="/forgot-password">forgot password</RouterLink>
            </div>
        </div>
    </div>
</template>

<style scoped></style>