<script setup>
import axios from "axios";
import { ref, reactive, onMounted, computed } from "vue";
import { Modal } from "bootstrap";

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE_URL });

// --- DATA ---
const orders = ref([]);
const orderDetails = ref([]);
const selectedOrder = ref(null);

const FLOW_RULES = {
  pending: ["confirmed", "cancelled"],    // Chờ xử lý -> Đã xác nhận HOẶC Hủy
  confirmed: ["shipping", "cancelled"],   // Đã xác nhận -> Đang giao HOẶC Hủy
  shipping: ["completed", "cancelled"],   // Đang giao -> Hoàn thành (hoặc hủy nếu bom hàng)
  completed: [],
  cancelled: []
};

const statusColors = {
  pending: "text-warning",
  confirmed: "text-info",
  shipping: "text-primary",
  completed: "text-success",
  cancelled: "text-danger"
};

const loadOrders = async () => {
  const res = await api.get("/orders?_expand=user&_sort=createdAt&_order=desc");
  orders.value = res.data;
};

const loadOrderItems = async (orderId) => {
  const res = await api.get(`/orderItems?orderId=${orderId}&_expand=product`);
  orderDetails.value = res.data;
};

const statusModalRef = ref(null);
const detailModalRef = ref(null);
let statusModalInstance = null;
let detailModalInstance = null;

const orderForm = reactive({
  id: "",
  currentStatus: "",
  newStatus: ""
});

onMounted(() => {
  statusModalInstance = new Modal(statusModalRef.value);
  detailModalInstance = new Modal(detailModalRef.value);
  loadOrders();
});

const openStatusModal = (order) => {
  selectedOrder.value = order;
  orderForm.id = order.id;
  orderForm.currentStatus = order.status;
  orderForm.newStatus = "";
  statusModalInstance.show();
};

const openDetailModal = async (order) => {
  selectedOrder.value = order;
  await loadOrderItems(order.id);
  detailModalInstance.show();
};

const availableNextStatuses = computed(() => {
  const current = orderForm.currentStatus;
  return FLOW_RULES[current] || [];
});

const updateStatus = async () => {
  if (!orderForm.newStatus) return alert("Vui lòng chọn trạng thái mới!");

  try {
    await api.patch(`/orders/${orderForm.id}`, {
      status: orderForm.newStatus
    });

    alert("Cập nhật trạng thái thành công!");
    statusModalInstance.hide();
    loadOrders();
  } catch (error) {
    console.error(error);
    alert("Lỗi khi cập nhật");
  }
};
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="text-primary fw-bold">Quản Lý Đơn Hàng</h2>
      <button class="btn btn-outline-primary" @click="loadOrders">
        <i class="bi bi-arrow-clockwise"></i> Làm mới
      </button>
    </div>

    <table class="table table-bordered">
      <thead class="table-primary text-center">
        <tr class="text-center">
          <th>Mã đơn</th>
          <th>Khách hàng</th>
          <th>Ngày tạo</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in orders" :key="o.id" class="text-center">
          <td class="fw-bold">#{{ o.id }}</td>
          <td>
            <div class="fw-bold">{{ o.fullname }}</div>
            <small class="text-muted" v-if="o.user">{{ o.user.email }}</small>
          </td>
          <td>{{ new Date(o.createdAt).toLocaleString('vi-VN') }}</td>
          <td class="fw-bold text-danger">{{ o.total }} USD</td>
          <td>
            <span class="badge rounded-pill bg-light border" :class="statusColors[o.status]">
              {{ o.status.toUpperCase() }}
            </span>
          </td>
          <td>
              <button class="btn btn-sm me-2 btn-info" @click="openDetailModal(o)">
                <i class="bi bi-eye"></i> Chi tiết
              </button>

              <button class="btn btn-sm btn-danger" @click="openStatusModal(o)"
                v-if="o.status === 'completed' || o.status === 'cancelled'" disabled>
                <i class="bi bi-pencil-square"></i> không thể sửa
              </button>
              <button v-else class="btn btn-sm btn-warning" @click="openStatusModal(o)">
                <i class="bi bi-pencil-square"></i> Cập nhật
              </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="modal fade" ref="statusModalRef" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Cập nhật trạng thái #{{ orderForm.id }}</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info d-flex align-items-center">
              <i class="bi bi-info-circle-fill me-2"></i>
              <div>
                Trạng thái hiện tại: <strong>{{ orderForm.currentStatus }}</strong>
              </div>
            </div>

            <label class="form-label fw-bold">Chuyển sang trạng thái:</label>

            <select class="form-select" v-model="orderForm.newStatus">
              <option value="" disabled>-- Chọn trạng thái tiếp theo --</option>
              <option v-for="st in availableNextStatuses" :key="st" :value="st">
                {{ st.toUpperCase() }}
              </option>
            </select>

            <div v-if="availableNextStatuses.length === 0" class="text-danger mt-2 small">
              * Đơn hàng này đã kết thúc, không thể thay đổi trạng thái.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button class="btn btn-primary" @click="updateStatus" :disabled="!orderForm.newStatus">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="detailModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">
              Chi tiết đơn hàng #{{ selectedOrder?.id }}
            </h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="row mb-4" v-if="selectedOrder">
              <div class="col-md-6">
                <h6 class="text-primary fw-bold">Thông tin người nhận</h6>
                <p class="mb-1"><strong>Tên:</strong> {{ selectedOrder.fullname }}</p>
                <p class="mb-1"><strong>SĐT:</strong> {{ selectedOrder.phone }}</p>
                <p class="mb-1"><strong>Địa chỉ:</strong> {{ selectedOrder.address }}</p>
              </div>
              <div class="col-md-6 text-end">
                <h6 class="text-primary fw-bold">Thanh toán</h6>
                <p class="mb-1">Hình thức: <span class="badge bg-secondary">{{ selectedOrder.payment }}</span></p>
                <p class="mb-1 fw-bold text-danger fs-5">Tổng: {{ selectedOrder.total }} USD</p>
              </div>
            </div>

            <h6 class="fw-bold border-bottom pb-2">Danh sách sản phẩm</h6>
            <div class="table-responsive">
              <table class="table table-bordered align-middle">
                <thead class="bg-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-center">Số lượng</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in orderDetails" :key="item.id">
                    <td>
                      <div class="d-flex align-items-center">
                        <img v-if="item.product" :src="item.product.imageUrl" class="rounded me-2"
                          style="width: 50px; height: 50px; object-fit: cover;">
                        <div>
                          <div class="fw-bold">{{ item.product?.name || 'Sản phẩm ' + item.productId }}</div>
                          <small class="text-muted">SKU: {{ item.productId }}</small>
                        </div>
                      </div>
                    </td>
                    <td class="text-center fw-bold">{{ item.quantity }}</td>
                    <td class="text-end">{{ item.price }}</td>
                    <td class="text-end fw-bold">{{ item.price * item.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
</style>