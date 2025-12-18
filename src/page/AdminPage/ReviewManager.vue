<script setup>
import axios from 'axios';
import { ref, onMounted, watch } from 'vue';

// --- DATA ---
const products = ref([]);
const reviews = ref([]);
const selectedProductId = ref("");

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: BASE_URL
});

// Hàm format ngày tháng
const formatDate = (dateString) => {
    if (!dateString) return "Vừa xong";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
};

const loadProducts = async () => {
    try {
        const res = await api.get("/products");
        products.value = res.data;
    } catch (err) {
        console.error("Toang khi load products:", err);
    }
};

// Lấy review theo productId
const loadReviewsByProduct = async (prodId) => {
    if (!prodId) {
        reviews.value = [];
        return;
    }
    try {
        const res = await api.get(`/reviews?productId=${prodId}&_expand=user`);
        reviews.value = res.data;
    } catch (err) {
        console.error("Lỗi khi hóng drama review:", err);
    }
};

// KHOÁ / MỞ KHOÁ REVIEW
const toggleLockReview = async (review) => {
    // nếu undefined coi như là chưa khoá - false
    const currentStatus = review.isHidden || false;
    
    const message = currentStatus 
        ? "Xác nhận mở khoá review" 
        : "Xác nhận khoá review này lại?";

    if (!confirm(message)) return;

    try {
        const newStatus = !currentStatus;
        
        await api.patch(`/reviews/${review.id}`, { 
            isHidden: newStatus 
        });

        review.isHidden = newStatus;
        

    } catch (err) {
        console.error("Lỗi khi khoá review:", err);
        alert("Lỗi rồi đại ca ơi, check console đi!");
    }
};


onMounted(() => {
    loadProducts();
});

watch(selectedProductId, (newVal) => {
    console.log("Đang xem review của mã:", newVal);
    loadReviewsByProduct(newVal);
});

</script>

<template>
    <div class="container mt-4">
        <h2 class="text-center fw-bold mb-4">Quản lý đánh giá</h2>

        <div class="card shadow-sm mb-4">
            <div class="card-body bg-light d-flex justify-content-between align-items-center">
                <label class="form-label fw-bold text-uppercase mb-0">Chọn lãnh địa cần kiểm soát:</label>
                <select class="form-select w-75 form-select-lg border-primary" v-model="selectedProductId">
                    <option value="">-- Chọn sản phẩm --</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">
                        {{ p.name }} ({{ p.id }})
                    </option>
                </select>
            </div>
        </div>

        <div v-if="selectedProductId">
            <div v-if="reviews.length === 0" class="alert alert-info text-center">
                Bình yên quá, chưa có review nào cả!
            </div>

            <div v-else>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5>Danh sách đánh giá ({{ reviews.length }})</h5>
                    <span class="badge bg-secondary">Admin Mode: ON</span>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3" v-for="r in reviews" :key="r.id">
                        <div class="card h-100 position-relative" 
                             :class="{ 'border-danger bg-secondary bg-opacity-10': r.isHidden, 'border-success': !r.isHidden }">
                            
                            <div class="position-absolute top-0 end-0 m-2">
                                <span v-if="r.isHidden" class="badge bg-danger">ĐÃ KHOÁ</span>
                                <span v-else class="badge bg-success">HIỂN THỊ</span>
                            </div>

                            <div class="card-header d-flex justify-content-between align-items-center bg-transparent border-bottom-0">
                                <span class="fw-bold d-flex align-items-center">
                                    👤 {{ r.user?.fullname || 'Ẩn danh' }}
                                    <span v-if="r.isHidden" class="ms-2 text-decoration-line-through text-muted small">(Bị chặn)</span>
                                </span>
                            </div>

                            <div class="card-body">
                                <div class="text-warning">
                                        <i v-for="n in 5" :key="n" 
                                           class="bi" 
                                           :class="n <= r.stars ? 'bi-star-fill' : 'bi-star'">
                                        </i>
                                    </div>
                                <p class="card-text fst-italic">
                                    "{{ r.comment || 'Không có lời bình luận' }}"
                                </p>
                                <hr>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Đơn: #{{ r.orderId }} - {{ formatDate(r.createdAt) }}</small>
                                    
                                    <button 
                                        class="btn btn-sm fw-bold" 
                                        :class="r.isHidden ? 'btn-outline-primary' : 'btn-outline-danger'"
                                        @click="toggleLockReview(r)"
                                    >
                                        <span v-if="r.isHidden">Mở lại</span>
                                        <span v-else>Khoá ngay</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Hiệu ứng mờ cho review bị khoá */
.bg-opacity-10 {
    --bs-bg-opacity: 0.1;
}
.card {
    transition: all 0.3s ease;
}
/* Review bình thường thì hover đẹp */
.card:not(.border-danger):hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
/* Review bị khoá thì xám xịt */
.card.border-danger {
    filter: grayscale(0.8);
}
</style>