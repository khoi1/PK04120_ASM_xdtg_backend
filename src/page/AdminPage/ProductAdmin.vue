<script setup>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { Modal } from 'bootstrap';

const products = ref([]);
const categories = ref([]);

const form = ref({
    id: '',
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 0,
    imageUrl: ''
});

const isEdit = ref(false); // true = edit, false = add

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
        await sleep(300);
        const res = await api.get("/products?_expand=category");
        products.value = res.data;
    } catch (err) {
        console.error(err);
    }
};

const loadCategories = async () => {
    try {
        const res = await api.get("/categories");
        categories.value = res.data;
    } catch (err) {
        console.error("Load categories error:", err);
    }
};

onMounted(() => {
    loadData();
    loadCategories();
});

// DELETE
const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xoá?")) return;
    await api.delete(`/products/${id}`);
    await loadData();
};

const modalRef = ref(null);
let modalInstance = null;

onMounted(() => {
    modalInstance = new Modal(modalRef.value);
});

const openAddModal = () => {
    isEdit.value = false;

    form.value = {
        id: '',
        name: '',
        description: '',
        price: '',
        categoryId: '',
        stock: 0,
        imageUrl: ''
    };


    modalInstance.show();
};

const handleEdit = (p) => {
    isEdit.value = true;

    form.value = {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId: p.categoryId,
        stock: p.stock,
        imageUrl: p.imageUrl
    };

    modalInstance.show();
};


// SUBMIT FORM 
const submitForm = async () => {
    if (!isEdit.value) {
        const existed = products.value.some(p => p.id == form.value.id);
        if (existed) {
            alert("ID đã tồn tại! Vui lòng chọn ID khác.");
            return;
        }
    }

    if (!form.value.name || !form.value.price || !form.value.id) {
        alert("ID, tên và giá không được để trống!");
        return;
    }

    if (form.value.price < 0 || form.value.stock < 0) {
        alert("Giá và tồn kho không được nhỏ hơn 0.");
        return;
    }

    const payload = {
        id: form.value.id,
        name: form.value.name,
        description: form.value.description,
        price: Number(form.value.price),
        categoryId: form.value.categoryId,
        stock: Number(form.value.stock),
        imageUrl: form.value.imageUrl
    };

    if (isEdit.value) {
        await api.put(`/products/${form.value.id}`, payload);
        alert("Cập nhật thành công!");
    } else {
        await api.post("/products", payload);
        alert("Thêm sản phẩm thành công!");
    }

    modalInstance.hide();
    await loadData();
};


// SEARCH 
const searchName = ref("");
const sortType = ref("");

const filteredProducts = computed(() => {
    let result = products.value.filter(p =>
        p.name.toLowerCase().includes(searchName.value.toLowerCase())
    );

    if (sortType.value === "asc") {
        result.sort((a, b) => a.price - b.price);
    } else if (sortType.value === "desc") {
        result.sort((a, b) => b.price - a.price);
    }

    return result;
});
</script>

<template>
    <div class="container">
        <div>
            <h2 class="text-center">Quản lý sản phẩm</h2>

            <h4>Tìm kiếm và sắp xếp</h4>
            <div class="d-flex justify-content-between">
                <div class="w-50 p-3 border my-3 d-flex">

                    <input class="form-control me-3" v-model="searchName" placeholder="Tìm theo tên" />
                    <select v-model="sortType" class="form-select">
                        <option value="">Sắp xếp</option>
                        <option value="asc">Giá tăng dần</option>
                        <option value="desc">Giá giảm dần</option>
                    </select>
                </div>
                <div class="p-3 my-3 w-25 d-flex justify-content-end">
                    <button class="btn btn-primary" @click="openAddModal">
                        + Thêm sản phẩm
                    </button>
                </div>
            </div>

            <table class="table table-bordered">
                <thead class="text-center table-primary">
                    <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Mô tả</th>
                        <th>Giá</th>
                        <th>Danh mục</th>
                        <th>Tồn kho</th>
                        <th>Hình ảnh</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody class="text-center align-content-center">
                    <tr v-for="p in filteredProducts" :key="p.id">
                        <td>{{ p.id }}</td>
                        <td>{{ p.name }}</td>
                        <td class="text-break" width="200px">{{ p.description }}</td>
                        <td class="text-danger fw-bold">{{ p.price }} USD</td>
                        <td>{{ p.category?.name }}</td>
                        <td>{{ p.stock }}</td>
                        <td><img :src="p.imageUrl" height="75px" :alt="p.name"></td>
                        <td>
                            <button class="btn btn-warning me-2" @click="handleEdit(p)">Sửa</button>
                            <button class="btn btn-danger" @click="handleDelete(p.id)">Xoá</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- MODAL -->
    <div class="modal fade" ref="modalRef" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm" }}
                    </h5>
                    <button class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <div class="form-group mb-2">
                        <label>ID</label>
                        <input class="form-control" v-model="form.id" :disabled="isEdit">
                    </div>

                    <div class="form-group mb-2">
                        <label>Tên</label>
                        <input class="form-control" v-model="form.name">
                    </div>

                    <div class="form-group mb-2">
                        <label>Mô tả</label>
                        <textarea class="form-control" v-model="form.description"></textarea>
                    </div>

                    <div class="form-group mb-2">
                        <label>Giá</label>
                        <input type="number" class="form-control" v-model="form.price">
                    </div>

                    <div class="form-group mb-2">
                        <label>Danh mục</label>
                        <select class="form-select" v-model="form.categoryId">
                            <option value="">-- Chọn danh mục --</option>
                            <option v-for="c in categories" :key="c.id" :value="c.id">
                                {{ c.name }}
                            </option>
                        </select>

                    </div>

                    <div class="form-group mb-2">
                        <label>Tồn kho</label>
                        <input type="number" class="form-control" v-model="form.stock">
                    </div>

                    <div class="form-group mb-2">
                        <label>Hình ảnh (URL)</label>
                        <input class="form-control" v-model="form.imageUrl">
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