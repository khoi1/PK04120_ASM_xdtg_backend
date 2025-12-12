<script setup>
import axios from "axios";
import { ref, computed, onMounted, inject, reactive } from "vue";

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE_URL });

const cart = ref([])
const share = inject('share')
let userid = 0;
const carts = ref([]);
const loading = ref(true);

const loadCart = async () => {
    try {
        const user = localStorage.getItem('ketqua')
        if (!user) {
            router.push('/login')
            return
        }

        const userObj = JSON.parse(user);
        userid = userObj.id;

        const response = await api.get(`/carts?userId=${userid}&_expand=product&_expand=user`)
        if (response.data?.length) {
            carts.value = response.data;
            share.carts = response.data;
        } else {
            cart.value = [];
        }
    }
    catch (error) {
        throw error
    }
    return false
};

const totalPrice = computed(() => {
    return carts.value.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
});

const increaseQty = async (cart) => {
    if (cart.quantity >= cart.product.stock) {
        alert("Vượt quá tồn kho!");
        return;
    }
    await api.put(`/carts/${cart.id}`, { ...cart, quantity: cart.quantity + 1 });
    loadCart();
};

const decreaseQty = async (cart) => {
    if (cart.quantity <= 1) return;
    await api.put(`/carts/${cart.id}`, { ...cart, quantity: cart.quantity - 1 });
    loadCart();
};

const removeCartItem = async (id) => {
    if (!confirm("Xóa sản phẩm khỏi giỏ?")) return;
    await api.delete(`/carts/${id}`);
    loadCart();
};

const loadCartInitial = async () => {
    loading.value = true;
    await loadCart();
    loading.value = false;
};
onMounted(() => {
    loadCartInitial();
});
</script>

<template>
    <div class="container mt-4">

        <h2 class="text-center mb-4">🛒 Giỏ hàng của bạn</h2>

        <!-- Khi đang load -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Đang tải giỏ hàng...</p>
        </div>

        <div class="row" v-else>
            <div class="col-lg-8">
                <table class="table table-bordered align-middle">
                    <thead class="table-primary text-center">
                        <tr>
                            <th>Hình</th>
                            <th>Tên</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>Tổng</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="c in carts" :key="c.id" class="text-center">
                            <td><img :src="c.product?.imageUrl" width="70"></td>

                            <td><router-link :to="`/product/${c.product?.id}`">{{ c.product?.name }}</router-link></td>

                            <td class="text-danger fw-bold">{{ c.product?.price }} USD</td>

                            <td>
                                <div class="d-flex justify-content-center align-items-center">
                                    <button class="btn btn-secondary btn-sm" @click="decreaseQty(c)">-</button>
                                    <span class="mx-3">{{ c.quantity }}</span>
                                    <button class="btn btn-secondary btn-sm" @click="increaseQty(c)">+</button>
                                </div>
                            </td>

                            <td class="fw-bold">
                                {{ Math.round(c.product?.price * c.quantity) }} USD
                            </td>

                            <td>
                                <button class="btn btn-danger" @click="removeCartItem(c.id)">Xóa</button>
                            </td>
                        </tr>

                        <tr v-if="carts.length === 0">
                            <td colspan="6" class="text-center text-muted">Giỏ hàng trống.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="col-lg-4">
                <div class="card shadow-sm mb-4">
                    <div class="card-body">
                        <h2 class="h5 mb-3">Tóm tắt đơn hàng</h2>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Tạm tính</span>
                            <span>{{ totalPrice }} USD</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Phí vận chuyển</span>
                            <span>Miễn phí</span>
                        </div>
                        <hr />
                        <div class="d-flex justify-content-between mb-3 fw-bold">
                            <span>Tổng cộng</span>
                            <span>{{ totalPrice }} USD</span>
                        </div>

                        <RouterLink to="/checkout" class="btn btn-primary w-100 mb-2">
                            Tiến hành thanh toán
                        </RouterLink>
                        <p class="small text-muted mb-0">
                            Khi đặt hàng bạn đã đồng ý với Điều khoản &amp; Chính sách của SimpleCart.
                        </p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>
