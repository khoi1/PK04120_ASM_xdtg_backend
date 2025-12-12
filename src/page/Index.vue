<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';

const topProducts = ref([])

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

onMounted(() => {
    loadData();
})

const loadData = async () => {
    try {
        await sleep(500)
        const [productsRes, ordersRes] = await Promise.all([
            api.get("/products"),
            api.get("/orderItems")
        ]);
        const allProducts = productsRes.data;
        const allOrderItems = ordersRes.data;

        const soldMap = {};
        allOrderItems.forEach(item => {
            if (soldMap[item.productId]) {
                soldMap[item.productId] += item.quantity;
            } else {
                soldMap[item.productId] = item.quantity;
            }
        });
        const productsWithStats = allProducts.map(p => {
            return {
                ...p,
                soldQuantity: soldMap[p.id] || 0 // Nếu chưa bán được cái nào thì là 0
            }
        });
        productsWithStats.sort((a, b) => b.soldQuantity - a.soldQuantity);
        topProducts.value = productsWithStats.slice(0, 4);
    } catch (err) {
        console.error(err);
    }

}
</script>

<template>
    <div class="container">
        <div id="homeCarousel" class="carousel slide carousel-fade slider" data-bs-ride="carousel">
            <div class="carousel-inner">
                <div class="carousel-item active">
                    <img class="d-block w-100" src="../assets/image1.png" alt="First slide">
                </div>
                <div class="carousel-item">
                    <img class="d-block w-100" src="../assets/image2.png" alt="Second slide">
                </div>
            </div>
            <a class="carousel-control-prev" href="#homeCarousel" role="button" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="sr-only"></span>
            </a>
            <a class="carousel-control-next" href="#homeCarousel" role="button" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="sr-only"></span>
            </a>
        </div>
    </div>

    <!-- SẢN PHẨM BÁN CHẠY -->
    <div class="container mt-5">
        <h3 class="fw-bold mb-4 text-center text-uppercase text-danger"><i class="bi bi-fire"></i> Top 4 Chiến Thần Bán Chạy <i class="bi bi-fire"></i></h3>
        
        <div class="row">
            <h5 class="text-center" v-show="topProducts.length == 0">Đang tìm mấy em hàng hot...</h5>
            
            <div class="col-md-3 mt-4" v-for="item in topProducts" :key="item.id">
                <div class="card shadow-sm h-100">
                    <div class="position-relative">
                        <img :src="item.imageUrl" class="card-img-top img-product" :alt="item.name" style="height: 250px; object-fit: contain; padding: 10px;">
                        
                        <span class="position-absolute top-0 start-0 badge bg-warning text-dark m-2 shadow-sm">
                            <i class="bi bi-star-fill"></i> Hot
                        </span>
                    </div>

                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold text-truncate" :title="item.name">{{ item.name }}</h6>
                        <p class="text-secondary small mb-1">
                            <i class="bi bi-bag-check-fill text-success"></i> Đã bán: <b>{{ item.soldQuantity }}</b>
                        </p>
                        
                        <p class="text-muted small text-truncate">{{ item.description }}</p>

                        <div class="mt-auto">
                            <h5 class="fw-bold text-danger mb-2">{{ item.price }} USD</h5>
                            <router-link class="btn btn-outline-danger w-100 btn-sm rounded-pill" :to="`/product/${item.id}`">
                                Xem ngay kẻo lỡ
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<style scoped>
.carousel-item img {
    height: 500px;
    object-fit: cover;
}

.carousel-control-prev-icon,
.carousel-control-next-icon {
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    background-size: 20px;
    width: 40px;
    height: 40px;
}
.slider img {
    height: 400px;
    object-fit: cover;
}
</style>