<script setup>
import axios from "axios";
import { ref, onMounted, computed } from "vue";

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE_URL });

const CURRENT_USER_ID = JSON.parse(localStorage.getItem('ketqua'));
console.log('user: ', CURRENT_USER_ID)

const wishlist = ref([]);
const isLoading = ref(true);

// --- CALL API ---
const loadFavorites = async () => {
    try {
        isLoading.value = true;
        const res = await api.get(`/favorites?userId=${CURRENT_USER_ID.id}&_expand=product`);
        wishlist.value = res.data;
    } catch (error) {
        console.error("Lỗi tải wishlist:", error);
    } finally {
        isLoading.value = false;
    }
};

// --- XÓA KHỎI YÊU THÍCH ---
const removeFavorite = async (favId) => {
    if (!confirm("Hết thương món này rồi hả sếp?")) return;

    try {
        await api.delete(`/favorites/${favId}`);

        wishlist.value = wishlist.value.filter(item => item.id !== favId);

    } catch (error) {
        alert("Lỗi mạng rồi, chưa xóa được!");
    }
};

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD'
    }).format(val);
};

onMounted(() => {
    loadFavorites();
});
</script>

<template>
    <div class="container py-5">
        <div class="d-flex align-items-center mb-4">
            <h2 class="fw-bold text-danger mb-0">
                <i class="bi bi-heart-fill me-2"></i>Sản phẩm yêu thích
            </h2>
            <span class="badge bg-secondary ms-3 rounded-pill">
                {{ wishlist.length }} món
            </span>
        </div>

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-danger" role="status"></div>
            <p class="mt-2 text-muted">Đang lục lại ký ức...</p>
        </div>

        <div v-else-if="wishlist.length === 0" class="text-center py-5 bg-light rounded-3">
            <i class="bi bi-heartbreak display-1 text-muted opacity-25"></i>
            <h4 class="mt-3 fw-bold text-secondary">Trống trơn à!</h4>
            <p class="text-muted">Bạn chưa "crush" món nào sao? Đi dạo một vòng đi!</p>
            <router-link to="/product" class="btn btn-primary px-4 rounded-pill mt-2">Shopping ngay</router-link>
        </div>

        <div v-else class="row g-4">
            <div v-for="item in wishlist" :key="item.id" class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm card-hover">

                    <div class="position-relative overflow-hidden">
                        <img :src="item.product?.imageUrl || 'https://via.placeholder.com/300'"
                            class="card-img-top object-fit-cover" style="height: 200px;" alt="Product Image">
                        <button @click="removeFavorite(item.id)"
                            class="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm btn-sm text-danger"
                            title="Bỏ thích">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>

                    <div class="card-body d-flex flex-column">
                        <div class="mb-2">
                            <span class="badge bg-info bg-opacity-10 text-info mb-2" v-if="item.product">
                                {{ item.product.categoryId }}
                            </span>
                            <h6 class="card-title fw-bold text-truncate">
                                {{ item.product?.name || 'Sản phẩm không tồn tại' }}
                            </h6>
                        </div>

                        <div class="mt-auto pt-3 border-top">
                            <p class="fw-bold text-danger mb-2 fs-5">{{ item.product?.price }} USD</p>
                            <router-link class="btn btn-outline-danger w-100 btn-sm rounded-pill"
                                :to="`/product/${item.product?.id}`">
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
.card-hover {
    transition: transform 0.2s, box-shadow 0.2s;
}

.card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15) !important;
}

.btn-light {
    opacity: 0.8;
    transition: opacity 0.2s;
}

.btn-light:hover {
    opacity: 1;
    background-color: #ffe6e6;
}
</style>