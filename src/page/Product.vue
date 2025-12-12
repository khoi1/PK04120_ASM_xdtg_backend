<script setup>
import axios from 'axios';
import { ref, onMounted, computed, reactive } from 'vue';

const products = ref([])
const categories = ref([])

const filter = reactive({
    name: "",
    category: "",
    sortOrder: ''
});
const favorites = reactive({});
const currentUser = ref(null);
const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE_URL });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

onMounted(() => {
    checkLogin();
    loadData();
})
const isFavorite = (productId) => {
    return !!favorites[productId]; // Trả về true nếu có trong danh sách
}
const checkLogin = () => {
    const userStr = localStorage.getItem('ketqua');

    if (userStr) {
        currentUser.value = JSON.parse(userStr);
        loadFavorites(currentUser.value.id);
    } else {
        currentUser.value = null;
    }
}
const loadFavorites = async (userId) => {
    if (!userId) return;

    try {
        const res = await api.get(`/favorites?userId=${userId}`);
        res.data.forEach(item => {
            favorites[item.productId] = item.id;
        });
    } catch (err) {
        console.error("Lỗi load tim:", err);
    }
}
const toggleFavorite = async (product) => {
    if (!currentUser.value) {
        alert("Vui lòng đăng nhập!");
        return;
    }

    try {
        const productId = product.id;
        const userId = currentUser.value.id;

        if (favorites[productId]) {
            // Đã tim -> XÓA
            const favoriteId = favorites[productId];
            await api.delete(`/favorites/${favoriteId}`);
            delete favorites[productId];
        } else {
            // Chưa tim -> THÊM
            const payload = {
                userId: userId,
                productId: productId
            };
            const res = await api.post('/favorites', payload);
            favorites[productId] = res.data.id;
        }
    } catch (err) {
        console.error("Lỗi thao tác tim:", err);
    }
}
const loadData = async () => {
    try {
        await sleep(500);
        const resProducts = await api.get("/products");
        const resCategories = await api.get("/categories");

        products.value = resProducts.data;
        categories.value = resCategories.data;
    } catch (err) {
        console.error(err);
    }
};

const filteredProducts = computed(() => {
    let result = [...products.value];

    const currentFilter = filter;

    if (currentFilter.name) {
        const key = currentFilter.name.toLowerCase().trim();
        result = result.filter(p => p.name.toLowerCase().includes(key));
    }

    if (currentFilter.category) {
        result = result.filter(p => p.categoryId === currentFilter.category);
    }

    if (currentFilter.sortOrder === 'asc') {
        result.sort((a, b) => a.price - b.price);
    } else if (currentFilter.sortOrder === 'desc') {
        result.sort((a, b) => b.price - a.price);
    }

    return result;
});

</script>

<template>
    <div class="container py-4">

        <h2 class="fw-bold mb-3 text-center">Danh sách sản phẩm</h2>

        <div class="card p-3 mb-4 shadow-sm bg-light">
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label fw-bold small">Tìm kiếm</label>
                    <input type="text" class="form-control" v-model="filter.name" placeholder="Gõ tên sản phẩm...">
                </div>

                <div class="col-md-4">
                    <label class="form-label fw-bold small">Danh mục</label>
                    <select class="form-select" v-model="filter.category">
                        <option value="">Tất cả danh mục</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                            {{ cat.name }}
                        </option>
                    </select>
                </div>

                <div class="col-md-4">
                    <label class="form-label fw-bold small">Sắp xếp giá</label>
                    <select class="form-select" v-model="filter.sortOrder">
                        <option value="">Mặc định</option>
                        <option value="asc">Giá: Thấp đến Cao</option>
                        <option value="desc">Giá: Cao đến Thấp</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Danh sách sản phẩm -->
        <div class="row">
            <h5 class="text-center" v-show="products.length == 0">item not found</h5>
            <div class="col-md-3 mb-4" v-for="item in filteredProducts" :key="item.id">
                
                <div class="card shadow-sm card-product h-100">
                    
                    <div class="position-relative overflow-hidden">
                        <img :src="item.imageUrl" class="card-img-top img-product p-3" :alt="item.name">

                        <button class="btn btn-favorite rounded-circle shadow-sm" 
                                @click="toggleFavorite(item)"
                                :class="{ 'active': isFavorite(item.id) }" 
                                title="Thêm vào yêu thích">
                            <i class="bi"
                               :class="isFavorite(item.id) ? 'bi-heart-fill text-danger' : 'bi-heart text-white'">
                            </i>
                        </button>
                    </div>

                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold">{{ item.name }}</h6>
                        <span v-if="item.category" class="badge bg-secondary mb-2 align-self-start">{{ item.category.name }}</span>
                        
                        <p class="text-muted small text-truncate">{{ item.description }}</p>

                        <div class="mt-auto pt-3 border-top">
                            <p class="fw-bold text-danger mb-2 fs-5">{{ item.price }} USD</p>
                            <router-link class="btn btn-outline-danger w-100 btn-sm rounded-pill" :to="`/product/${item.id}`">
                                Xem chi tiết
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.img-product {
    height: 250px;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.card-product:hover .img-product {
    transform: scale(1.05);
    filter: brightness(95%) blur(3px);
}

.btn-favorite {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 50px; 
    height: 50px;
    background: rgba(33, 37, 41, 0.7);;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    cursor: pointer;
    z-index: 10;
    
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}

.card-product:hover .btn-favorite {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.btn-favorite.active {
    background: #fff0f0;
}

.btn-favorite:hover {
    background: #ff4757;
    color: white !important;
}
.btn-favorite:hover i {
    color: white !important;
}
</style>