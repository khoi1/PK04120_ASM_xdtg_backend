<script setup>
import axios from 'axios'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const related = ref([]);
const reviews = ref([]);
const qty = ref(1)
const activeTab = ref('reviews')

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: BASE_URL
});

const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0;

    const totalStars = reviews.value.reduce((sum, r) => sum + r.stars, 0);
    return (totalStars / reviews.value.length).toFixed(1);
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const loadDetail = async () => {
    try {
        await sleep(300)

        const response = await api.get(`/products/${route.params.id}`)
        product.value = response.data

        if (product.value) {
            loadRelated();
            loadReviews();
        }
    } catch (err) {
        console.error(err);
    }
}

const loadReviews = async () => {
    const res = await api.get(`/reviews?productId=${product.value.id}&_sort=createdAt&_order=desc&_expand=user`);
    reviews.value = res.data.filter(r => !r.isHidden);
};

const loadRelated = async () => {
    if (!product.value) return;

    const category = product.value.categoryId;
    const id = product.value.id;

    const res = await api.get(`/products?categoryId=${category}&id_ne=${id}&_limit=3`);

    related.value = res.data;
};

const addToCart = async () => {
    const user = JSON.parse(localStorage.getItem("ketqua"))

    if (!user) {
        alert("Bạn phải đăng nhập trước!")
        router.push('/login')
        return
    }

    const userId = user.id
    const prod = product.value

    if (qty.value < 1) {
        alert("Số lượng không hợp lệ!")
        return
    }

    if (qty.value > prod.stock) {
        alert("Không đủ tồn kho!")
        return
    }

    const res = await api.get(`/carts?userId=${userId}&productId=${prod.id}`)

    if (res.data.length > 0) {
        const cartItem = res.data[0]

        const newQty = cartItem.quantity + qty.value

        if (newQty > prod.stock) {
            alert("Số lượng vượt quá tồn kho!")
            return
        }

        await api.put(`/carts/${cartItem.id}`, {
            ...cartItem,
            quantity: newQty
        })

    } else {
        await api.post("/carts", {
            id: Date.now().toString(),
            userId,
            productId: prod.id,
            quantity: qty.value
        })
    }

    alert("Đã thêm vào giỏ hàng!")
}
watchEffect(() => {
    const id = route.params.id;
    if (id) {
        loadDetail();
        window.scrollTo(0, 0);
    }
});

const switchTab = (tabName) => {
    activeTab.value = tabName
}
</script>

<template>

    <div class="container py-4">

        <router-link class="btn btn-outline-secondary mb-3" to="/product">Quay lại</router-link>

        <div v-if="product === null">
            Đang load...
        </div>

        <div v-else class="row">

            <div class="col-md-5 mb-3">
                <div class="card shadow-sm">
                    <img :src="product.imageUrl" class="card-img-top" alt="image" style="height: 400px;">
                </div>
            </div>

            <div class="col-md-7">

                <h3 class="fw-bold">{{ product.name }}</h3>
                <p class="text-muted">Mã SP: {{ product.id }}</p>
                <div class="d-flex align-items-center mb-3">
                    Tồn kho: {{ product.stock }}
                </div>

                <h4 class="text-danger fw-bold">{{ product.price }} USD</h4>

                <p class="mt-3">{{ product.description }}</p>

                <div class="d-flex align-items-center mb-3">
                    <label class="me-2 fw-bold">Số lượng:</label>
                    <input type="number" v-model="qty" min="1" class="form-control w-25">
                </div>

                <div class="d-flex gap-2 mt-3 w-50">
                    <button class="btn btn-primary flex-grow-1" @click="addToCart">
                        Thêm vào giỏ hàng
                    </button>
                </div>

            </div>
        </div>
        <div class="mt-5">
            <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeTab === 'reviews', 'fw-bold': activeTab === 'reviews' }"
                        href="#" @click.prevent="switchTab('reviews')"> Đánh giá khách hàng
                    </a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeTab === 'related', 'fw-bold': activeTab === 'related' }"
                        href="#" @click.prevent="switchTab('related')"> Sản phẩm liên quan
                    </a>
                </li>
            </ul>

            <div v-if="activeTab === 'reviews'">
                <div v-if="reviews.length === 0" class="alert alert-light text-center">
                    Chưa có đánh giá nào. Hãy là người đầu tiên mua và review nhé!
                </div>

                <div v-else class="row">
                    <div class="col-md-8">
                        <div v-for="rev in reviews" :key="rev.id" class="card mb-3 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h6 class="fw-bold mb-1">{{ rev.user?.fullname }}</h6>
                                        <div class="text-warning small mb-2">
                                            <span v-for="n in 5" :key="n">
                                                <i v-if="n <= rev.stars" class="bi bi-star-fill"></i>
                                                <i v-else class="bi bi-star text-secondary opacity-25"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        {{ new Date(rev.createdAt).toLocaleDateString() }}
                                    </small>
                                </div>
                                <p class="card-text bg-light p-2 rounded">
                                    {{ rev.comment }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="card bg-light border-0 p-3 text-center sticky-top" style="top: 20px;">
                            <h1 class="display-4 fw-bold text-warning mb-0">{{ averageRating }}</h1>
                            <div class="mb-2 fs-4">
                                <span v-for="n in 5" :key="n" class="mx-1">
                                    <i v-if="n <= Math.floor(Number(averageRating))"
                                        class="bi bi-star-fill text-warning"></i>
                                    <i v-else-if="n === Math.ceil(Number(averageRating)) && Number(averageRating) % 1 !== 0"
                                        class="bi bi-star-half text-warning"></i>
                                    <i v-else class="bi bi-star text-secondary opacity-50"></i>
                                </span>
                            </div>
                            <p class="text-muted">Dựa trên {{ reviews.length }} đánh giá</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'related'">
                <div v-if="related.length === 0" class="text-center text-muted py-5">
                    <p>Không có sản phẩm liên quan nào</p>
                </div>
                <div v-else class="row">
                    <div class="col-md-3" v-for="item in related" :key="item.id">
                        <div class="card shadow-sm mb-3 h-100">
                            <img :src="item.imageUrl" class="card-img-top img-product">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title text-truncate">{{ item.name }}</h5>
                                <p class="text-danger fw-bold mb-2">{{ item.price }} USD</p>
                                <router-link class="btn btn-outline-danger w-100 btn-sm rounded-pill mt-auto"
                                    :to="`/product/${item.id}`">
                                    Xem chi tiết
                                </router-link>
                            </div>
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
}
</style>
