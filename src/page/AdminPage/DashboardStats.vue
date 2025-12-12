<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE_URL });

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
);

const orders = ref([]);
const products = ref([]);
const categories = ref([]);
const users = ref([]);
const isLoading = ref(true);

const loadDashboardData = async () => {
    try {
        isLoading.value = true;
        const [resOrders, resProducts, resCats, resUsers] = await Promise.all([
            api.get('/orders'),
            api.get('/products'),
            api.get('/categories'),
            api.get('/users')
        ]);

        orders.value = resOrders.data;
        products.value = resProducts.data;
        categories.value = resCats.data;
        users.value = resUsers.data;
    } catch (error) {
        console.error("Lỗi API:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadDashboardData();
});

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(val);
};

const stats = computed(() => {
    const completedOrders = orders.value.filter(o => o.status === 'completed');
    return {
        revenue: completedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
        totalOrders: orders.value.length,
        pendingOrders: orders.value.filter(o => o.status === 'pending').length,
        totalStock: products.value.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
    };
});

const revenueChartData = computed(() => {
    const completedOrders = orders.value.filter(o => o.status === 'completed');
    const revenueMap = {};

    completedOrders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        revenueMap[date] = (revenueMap[date] || 0) + (Number(order.total) || 0);
    });

    const labels = Object.keys(revenueMap).sort((a, b) => {
        const [d1, m1] = a.split('/');
        const [d2, m2] = b.split('/');
        return new Date(2025, m1 - 1, d1) - new Date(2025, m2 - 1, d2);
    });

    return {
        labels,
        datasets: [{
            label: 'Doanh thu (USD)',
            data: labels.map(date => revenueMap[date]),
            borderColor: '#4e54c8',
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(78, 84, 200, 0.5)');
                gradient.addColorStop(1, 'rgba(78, 84, 200, 0.05)');
                return gradient;
            },
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };
});

const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: true },
        tooltip: {
            callbacks: {
                label: (context) => formatCurrency(context.raw)
            }
        }
    },
    scales: {
        y: {
            ticks: {
                callback: (value) => '$' + (value / 1000).toFixed(1) + 'k'
            }
        }
    }
};

const categoryChartData = computed(() => {
    const countMap = {};
    products.value.forEach(p => {
        countMap[p.categoryId] = (countMap[p.categoryId] || 0) + 1;
    });

    let mergedData = categories.value.map(c => ({
        name: c.name,
        count: countMap[c.id] || 0
    }));

    mergedData.sort((a, b) => b.count - a.count);

    const topList = mergedData.slice(0, 5);
    const others = mergedData.slice(5);

    if (others.length > 0) {
        const othersCount = others.reduce((sum, item) => sum + item.count, 0);
        topList.push({ name: 'Khác (Others)', count: othersCount });
    }

    return {
        labels: topList.map(item => item.name),
        datasets: [{
            label: 'Products',
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#c9cbcf'],
            data: topList.map(item => item.count),
            borderRadius: 6,
            barThickness: 40
        }]
    };
});

const recentOrders = computed(() => {
    return [...orders.value]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
});

const getStatusBadge = (status) => {
    const map = {
        completed: 'bg-success bg-opacity-10 text-success',
        pending: 'bg-warning bg-opacity-10 text-warning',
        cancelled: 'bg-danger bg-opacity-10 text-danger',
        shipping: 'bg-info bg-opacity-10 text-info'
    };
    return map[status] || 'bg-secondary';
};
</script>

<template>
    <div class="container-fluid p-4 bg-light min-vh-100">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="fw-bold text-dark mb-0">Dashboard Tổng Quan</h3>
                <p class="text-muted small">Đơn vị tiền tệ: <b>USD ($)</b></p>
            </div>
            <button class="btn btn-white shadow-sm fw-bold text-primary" @click="loadDashboardData">
                <i class="bi bi-arrow-repeat me-1"></i> Refresh
            </button>
        </div>

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else>
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100 py-2 border-start border-4 border-primary">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase fw-bold">Doanh Thu</div>
                            <div class="h3 fw-bold text-primary mb-0">{{ formatCurrency(stats.revenue) }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100 py-2 border-start border-4 border-warning">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase fw-bold">Đơn Chờ Xử Lý</div>
                            <div class="h3 fw-bold text-dark mb-0">{{ stats.pendingOrders }} <span
                                    class="fs-6 text-muted fw-normal">đơn</span></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100 py-2 border-start border-4 border-success">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase fw-bold">Tổng Đơn Hàng</div>
                            <div class="h3 fw-bold text-success mb-0">{{ stats.totalOrders }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100 py-2 border-start border-4 border-info">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase fw-bold">Tổng Thành Viên</div>
                            <div class="h3 fw-bold text-info mb-0">{{ users.length }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white border-0 py-3">
                            <h5 class="fw-bold mb-0 text-primary"><i class="bi bi-currency-dollar me-2"></i>Doanh Thu
                                Theo Ngày</h5>
                        </div>
                        <div class="card-body">
                            <div style="height: 300px;">
                                <Line v-if="revenueChartData.labels.length" :data="revenueChartData"
                                    :options="revenueChartOptions" />
                                <div v-else class="h-100 d-flex align-items-center justify-content-center text-muted">
                                    Chưa có dữ liệu
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white border-0 py-3">
                            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-pie-chart me-2"></i>Phân Bổ Sản Phẩm</h5>
                        </div>
                        <div class="card-body">
                            <div style="height: 300px;">
                                <Bar v-if="categoryChartData.labels.length" :data="categoryChartData"
                                    :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="fw-bold mb-0"><i class="bi bi-cart4"></i> Đơn Hàng Mới Nhất</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th class="ps-4">Mã Đơn</th>
                                <th>Khách Hàng</th>
                                <th>Ngày Đặt</th>
                                <th>Tổng Tiền</th>
                                <th>Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in recentOrders" :key="order.id">
                                <td class="ps-4 fw-bold text-primary">#{{ order.id }}</td>
                                <td>
                                    <div class="fw-bold text-dark">{{ order.fullname }}</div>
                                </td>
                                <td>{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</td>
                                <td class="fw-bold">{{ formatCurrency(order.total) }}</td>
                                <td>
                                    <span class="badge rounded-pill px-3 py-2" :class="getStatusBadge(order.status)">
                                        {{ order.status }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>