<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';

const categories = ref([]);

const form = ref({
    id: '',
    name: ''
});

const isEdit = ref(false);

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: BASE_URL
});

// LOAD DATA

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const loadData = async () => {
    try {
        await sleep(200);
        const res = await api.get("/categories");
        categories.value = res.data;
    } catch (err) {
        console.error(err);
    }
};

onMounted(() => loadData());

// DELETE

const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xoá?")) return;
    await api.delete(`/categories/${id}`);
    await loadData();
};

// MODAL
const modalRef = ref(null);
let modalInstance = null;

onMounted(() => {
    modalInstance = new Modal(modalRef.value);
});

const openAddModal = () => {
    isEdit.value = false;
    form.value = { id: '', name: '', description: '' };
    modalInstance.show();
};

const handleEdit = (c) => {
    isEdit.value = true;
    form.value = { ...c };
    modalInstance.show();
};

// SUBMIT

const submitForm = async () => {
    if (!form.value.name) {
        alert("Tên danh mục không được bỏ trống!");
        return;
    }

    if (isEdit.value) {
        await api.put(`/categories/${form.value.id}`, form.value);
        alert("Cập nhật thành công!");
    } else {
        await api.post("/categories", form.value);
        alert("Thêm danh mục thành công!");
    }

    modalInstance.hide();
    await loadData();
};
</script>

<template>
    <div class="container">
        <h2 class="text-center">Quản lý Danh Mục</h2>

        <div class="text-end my-3">
            <button class="btn btn-primary" @click="openAddModal">+ Thêm danh mục</button>
        </div>

        <table class="table table-bordered">
            <thead class="table-primary text-center">
                <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Thao tác</th>
                </tr>
            </thead>

            <tbody class="text-center">
                <tr v-for="c in categories" :key="c.id">
                    <td>{{ c.id }}</td>
                    <td>{{ c.name }}</td>
                    <td>
                        <button class="btn btn-warning me-2" @click="handleEdit(c)">Sửa</button>
                        <button class="btn btn-danger" @click="handleDelete(c.id)">Xoá</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- MODAL -->
    <div class="modal fade" ref="modalRef" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">{{ isEdit ? "Sửa danh mục" : "Thêm danh mục" }}</h5>
                    <button class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <div class="form-group mb-2">
                        <label>ID</label>
                        <input class="form-control" v-model="form.id" :disabled="isEdit" required>
                    </div>

                    <div class="form-group mb-2">
                        <label>Tên danh mục</label>
                        <input class="form-control" v-model="form.name">
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
