<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';

const users = ref([]);

const form = ref({
    id: '',
    fullname: '',
    username: '',
    password: '',
    role: 'user'
});

const isEdit = ref(false);

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: BASE_URL
});

// LOAD DATA
const loadUsers = async () => {
    try {
        const res = await api.get("/users");
        users.value = res.data;
    } catch (err) {
        console.error(err);
    }
};

onMounted(() => loadUsers());

// DELETE
const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xoá người dùng này?")) return;
    await api.delete(`/users/${id}`);
    await loadUsers();
};

// MODAL
const modalRef = ref(null);
let modalInstance = null;

onMounted(() => {
    modalInstance = new Modal(modalRef.value);
});

const openAddModal = () => {
    isEdit.value = false;

    form.value = {
        id: '',
        fullname: '',
        username: '',
        password: '',
        role: 'user'
    };

    modalInstance.show();
};

const handleEdit = (u) => {
    isEdit.value = true;
    form.value = { ...u };
    modalInstance.show();
};

// SUBMIT
const submitForm = async () => {
    if (!form.value.fullname || !form.value.username) {
        alert("Tên và email không được để trống!");
        return;
    }

    if (!isEdit.value) {
        const existId = users.value.some(u => u.id == form.value.id);
        if (existId) {
            alert("ID đã tồn tại! Vui lòng chọn ID khác.");
            return;
        }
    }

    const existEmail = users.value.some(
        u => u.username === form.value.username && u.id !== form.value.id
    );

    if (existEmail) {
        alert("Email này đã được sử dụng!");
        return;
    }

    if (!isEdit.value) {
        // CREATE
        await api.post("/users", form.value);
        alert("Thêm người dùng thành công!");
    } else {
        // UPDATE
        await api.put(`/users/${form.value.id}`, form.value);
        alert("Cập nhật thành công!");
    }

    modalInstance.hide();
    await loadUsers();
};
</script>

<template>
    <div class="container">

        <h2 class="text-center my-3">Quản lý người dùng</h2>

        <div class="text-end my-3">
            <button class="btn btn-primary" @click="openAddModal">+ Thêm người dùng</button>
        </div>

        <table class="table table-bordered">
            <thead class="table-primary text-center">
                <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Thao tác</th>
                </tr>
            </thead>

            <tbody class="text-center">
                <tr v-for="u in users" :key="u.id">
                    <td>{{ u.id }}</td>
                    <td>{{ u.fullname }}</td>
                    <td>{{ u.username }}</td>
                    <td class="fw-bold text-primary">{{ u.role }}</td>

                    <td>
                        <button class="btn btn-warning me-2" @click="handleEdit(u)">Sửa</button>
                        <button class="btn btn-danger" @click="handleDelete(u.id)">Xoá</button>
                    </td>
                </tr>
            </tbody>
        </table>

    </div>

    <!-- ========== MODAL ========== -->
    <div class="modal fade" ref="modalRef" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">{{ isEdit ? "Sửa người dùng" : "Thêm người dùng" }}</h5>
                    <button class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <div class="form-group mb-2">
                        <label>ID</label>
                        <input v-model="form.id" class="form-control" :disabled="isEdit">
                    </div>

                    <div class="form-group mb-2">
                        <label>Tên</label>
                        <input v-model="form.fullname" class="form-control">
                    </div>

                    <div class="form-group mb-2">
                        <label>Email</label>
                        <input v-model="form.username" class="form-control">
                    </div>

                    <div class="form-group mb-2">
                        <label>Mật khẩu</label>
                        <input type="password" v-model="form.password" class="form-control">
                    </div>

                    <div class="form-group mb-2">
                        <label>Role</label>
                        <select v-model="form.role" class="form-select">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    <button class="btn btn-primary" @click="submitForm">
                        {{ isEdit ? "Lưu thay đổi" : "Thêm mới" }}
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped></style>
