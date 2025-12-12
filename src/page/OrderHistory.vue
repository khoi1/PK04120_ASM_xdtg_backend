<script setup>
import axios from "axios";
import { ref, reactive, onMounted } from "vue";
import { Modal } from "bootstrap";
import { useRouter } from 'vue-router';
const router = useRouter();

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE_URL });

const user = JSON.parse(localStorage.getItem("ketqua"));

const orders = ref([]);
const reviewData = reactive({
  orderId: null,
  productId: null,
  productName: '',
  stars: 5,
  comment: ''
});
const reviewModalRef = ref(null);
let reviewModalInstance = null;
const reviewedProductIds = ref([]);

const loadOrders = async () => {
  const res = await api.get(`/orders?userId=${user.id}`);
  orders.value = res.data;
};

const orderDetail = ref(null);
const items = ref([]);

const modalRef = ref(null);
let modalInstance = null;

onMounted(() => {
  if (!user) {
    alert("Bạn phải đăng nhập!");
    return;
  }
  loadOrders();
  modalInstance = new Modal(modalRef.value);
  reviewModalInstance = new Modal(reviewModalRef.value);
});

const openReviewModal = (item, orderId) => {
  reviewData.orderId = orderId;
  reviewData.productId = item.productId;
  reviewData.productName = item.product.name;
  reviewData.stars = 5;
  reviewData.comment = '';


  reviewModalInstance.show();
};

const submitReview = async () => {
  try {
    await api.post('/reviews', {
      userId: user.id,
      orderId: reviewData.orderId,
      productId: reviewData.productId,
      stars: reviewData.stars,
      comment: reviewData.comment,
      createdAt: new Date().toISOString()
    });

    alert("Đánh giá thành công! Shop sẽ tiếp thu (hoặc không).");
    reviewModalInstance.hide();

    modalInstance.hide();
  } catch (error) {
    console.error(error);
    alert("Lỗi rồi, chắc server sợ bị 1 sao đó!");
  }
};

// OPEN MODAL DETAIL
const openDetail = async (order) => {
  orderDetail.value = order;
  reviewedProductIds.value = [];

  // Lấy danh sách sản phẩm trong đơn
  const resItems = await api.get(
    `/orderItems?orderId=${order.id}&_expand=product`
  );

  items.value = resItems.data;

  const resReviews = await api.get(
    `/reviews?orderId=${order.id}&userId=${user.id}`
  );

  reviewedProductIds.value = resReviews.data.map(r => r.productId)

  modalInstance.show();
};
const statusMapping = {
  pending: "bg-warning text-dark", // Màu vàng: Cảnh báo nhẹ
  confirmed: "bg-primary",           // Màu xanh dương: Ok la
  shipping: "bg-info text-dark",    // Màu xanh lơ: Đang đi
  completed: "bg-success",           // Màu xanh lá: Uy tín
  cancelled: "bg-danger"            // Màu đỏ: Toang
};

// Hàm helper để lấy thông tin an toàn (tránh lỗi nếu status lạ)
const getStatusInfo = (status) => {
  return statusMapping[status]
};

// Tính năng mua lại
const buyAgain = async (order) => {

  const confirmBuy = confirm("Bạn muốn thêm tất cả sản phẩm trong đơn này vào giỏ hàng chứ?");
  if (!confirmBuy) return;

  try {
    const resOrderItems = await api.get(`/orderItems?orderId=${order.id}&_expand=product`);
    const itemsToBuy = resOrderItems.data;
    console.log(itemsToBuy)
    const resCart = await api.get(`/carts?userId=${user.id}`);
    const currentCart = resCart.data;

    for (const item of itemsToBuy) {
      if (!item.product) {
        alert(`Sản phẩm ${item.product?.name} hiện không còn kinh doanh!`);
        return;
      }

      const currentStock = item.product.stock;
      const wantToBuyQty = item.quantity; // Số lượng muốn mua thêm từ đơn cũ

      // Tìm xem trong giỏ đã có món này chưa
      const cartItem = currentCart.find(c => c.productId === item.productId);
      const currentCartQty = cartItem?.quantity ?? 0; // Số lượng đang nằm trong giỏ

      // Tính tổng
      const totalQty = currentCartQty + wantToBuyQty;

      if (totalQty > currentStock) {
        alert(
          `Món "${item.product.name}" chỉ còn tồn kho ${currentStock}.\n` +
          `Trong giỏ bạn đang có ${currentCartQty}`
        );
        return;
      }
    }

    const promises = itemsToBuy.map(async (item) => {
      const existingCartItem = currentCart.find(c => c.productId === item.productId);

      if (existingCartItem) {
        const newQty = existingCartItem.quantity + item.quantity;
        return api.patch(`/carts/${existingCartItem.id}`, {
          quantity: newQty
        });
      } else {
        return api.post('/carts', {
          userId: user.id,
          productId: item.productId,
          quantity: item.quantity
        });
      }
    });

    // Chờ tất cả request chạy xong
    await Promise.all(promises);

    alert("Đã thêm toàn bộ vào giỏ hàng! Vào chốt đơn ngay cho nóng!");
  } catch (error) {
    console.error(error);
    alert("Có lỗi xảy ra, chắc server đang bận yêu đương rồi!");
  }
};

const cancelOrder = async (order) => {
  if (order.status !== 'pending') {
    alert("Đơn này shipper bốc đi rồi, không huỷ được đâu ní ơi!");
    return;
  }

  const confirmCancel = confirm("Bạn chắc chắn muốn huỷ đơn này chứ? Tiếc lắm á 😢");
  if (!confirmCancel) return;

  try {
    const resItems = await api.get(`/orderItems?orderId=${order.id}&_expand=product`);
    const itemsToReturn = resItems.data;

    const returnStockPromises = itemsToReturn.map(item => {
      // Stock cũ + Số lượng khách boom hàng
      const newStock = item.product.stock + item.quantity;
      return api.patch(`/products/${item.productId}`, {
        stock: newStock
      });
    });

    await Promise.all(returnStockPromises);

    await api.patch(`/orders/${order.id}`, {
      status: 'cancelled'
    });

    alert("Đã huỷ đơn thành công! Tiền (nếu đã trả) sẽ về trong giấc mơ nhé 💸");

    loadOrders();

    if (orderDetail.value && orderDetail.value.id === order.id) {
      modalInstance.hide();
    }

  } catch (error) {
    console.error("Lỗi huỷ đơn:", error);
    alert("Lỗi hệ thống! Không huỷ được, chắc vũ trụ muốn bạn mua món này rồi.");
  }
};
</script>

<template>
  <div class="container py-4">
    <h2 class="text-center mb-4">Đơn hàng của tôi</h2>

    <div v-if="orders.length === 0" class="alert alert-info">Bạn chưa có đơn hàng nào.</div>

    <div class="row g-4">
      <div v-for="o in orders" :key="o.id" class="col-12 col-md-4">

        <div class="card shadow-sm h-100">
          <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fs-6">#{{ o.id }}</h5>
            <span class="badge" :class="getStatusInfo(o.status)">{{ o.status }}</span>
          </div>

          <div class="card-body">
            <p class="text-muted small mb-2">Ngày: {{ new Date(o.createdAt).toLocaleDateString() }}</p>
            <div class="fw-bold text-danger fs-5 mb-3">{{ o.total }} USD</div>

            <div class="d-grid gap-2">
              <button class="btn btn-sm btn-outline-primary fw-bold" @click="openDetail(o)">
                Xem chi tiết
              </button>
              <button v-if="o.status === 'pending'" class="btn btn-sm btn-outline-danger fw-bold"
                @click="cancelOrder(o)">
                <i class="bi bi-x-circle"></i> Huỷ đơn
              </button>
              <button v-if="o.status === 'completed' || o.status === 'cancelled'"
                class="btn btn-sm btn-outline-warning fw-bold" @click="buyAgain(o)">
                <i class="bi bi-cart-plus"></i> Mua lại
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- MODAL CHI TIẾT ĐƠN -->
  <div class="modal fade" ref="modalRef" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title">
            Chi tiết đơn hàng #{{ orderDetail?.id }}
          </h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">

          <div v-if="orderDetail">
            <p><strong>Trạng thái:</strong>
              <span class="badge" :class="getStatusInfo(orderDetail.status)">{{ orderDetail.status }}</span>
            </p>

            <p><strong>Ngày tạo:</strong>
              {{ new Date(orderDetail.createdAt).toLocaleString() }}
            </p>

            <hr />

            <h5>Sản phẩm</h5>

            <ul class="list-group">
              <li v-for="it in items" :key="it.id" class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ it.product.name }}</strong>
                    <div class="text-muted small">x{{ it.quantity }}</div>
                  </div>
                  <div class="text-end">
                    <span class="fw-bold text-danger d-block">
                      {{ it.price * it.quantity }} USD
                    </span>
                    <button v-if="reviewedProductIds.includes(it.productId)" class="btn btn-sm btn-primary" disabled>
                      <i class="bi bi-check-circle-fill"></i> Đã đánh giá
                    </button>
                    <button v-if="!reviewedProductIds.includes(it.productId) && orderDetail.status === 'completed'"
                      class="btn btn-sm btn-outline-warning mt-1" @click="openReviewModal(it, orderDetail.id)">
                      <i class="bi bi-star-fill"></i> Đánh giá
                    </button>
                  </div>
                </div>
              </li>
            </ul>

            <hr />
            <div class="d-flex justify-content-between fw-bold">
              <span>Tổng tiền:</span>
              <span class="text-danger">{{ orderDetail.total }} USD</span>
            </div>
          </div>

        </div>

        <div class="modal-footer">
          <button v-if="orderDetail && (orderDetail.status === 'completed' || orderDetail.status === 'cancelled')"
            class="btn btn-warning" @click="buyAgain(orderDetail)">
            <i class="bi bi-cart-plus"></i> Mua lại
          </button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        </div>

      </div>
    </div>
  </div>
  <div class="modal fade" ref="reviewModalRef" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Đánh giá: {{ reviewData.productName }}</h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">

          <div class="mb-3 text-center">
            <label class="form-label d-block fw-bold">Mức độ hài lòng</label>
            <div class="fs-3">
              <span v-for="n in 5" :key="n" @click="reviewData.stars = n" class="cursor-pointer mx-1"
                :class="n <= reviewData.stars ? 'text-warning' : 'text-secondary'" style="cursor: pointer;">
                <i class="bi bi-star"></i>
              </span>
            </div>
            <div class="text-muted small mt-1">
              (Bạn đang chọn: {{ reviewData.stars }} sao)
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Nhận xét</label>
            <textarea v-model="reviewData.comment" class="form-control" rows="3"
              placeholder="Sản phẩm..."></textarea>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Thôi bỏ qua</button>
          <button class="btn btn-primary" @click="submitReview">Gửi đánh giá</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
