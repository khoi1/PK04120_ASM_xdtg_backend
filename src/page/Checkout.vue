<script setup>
import { reactive, ref, onMounted, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const share = inject('share')
console.log('share', share)
const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: BASE_URL
});

const checkoutForm = reactive({
  phone: "",
  address: "",
  note: ""
})
const errors = reactive({
  fullname: "",
  email: "",
  phone: "",
  address: ""
})
const formUser = reactive({ ...share.user })
const totalCart = computed(() => {
  return share.carts.reduce(
    (sum, c) => sum + c.product.price * c.quantity,
    0
  )
})
const validateForm = () => {
  let ok = true

  // Fullname
  if (!formUser.fullname || formUser.fullname.trim() === "") {
    errors.fullname = "Tên không được để trống"
    ok = false
  } else {
    errors.fullname = ""
  }

  // Email
  if (!formUser.username || formUser.username.trim() === "") {
    errors.email = "Email không được để trống"
    ok = false
  } else {
    errors.email = ""
  }

  // Phone
  if (checkoutForm.phone.length !== 10) {
    errors.phone = "Số điện thoại phải có 10 chữ số"
    ok = false
  } else {
    errors.phone = ""
  }

  // Address
  if (!checkoutForm.address || checkoutForm.address.trim() === "") {
    errors.address = "Địa chỉ không được để trống"
    ok = false
  } else {
    errors.address = ""
  }

  return ok
}

const placeOrder = async () => {
  try {
    const userLocal = JSON.parse(localStorage.getItem("ketqua"))
    if (!userLocal) {
      alert("Bạn phải đăng nhập!")
      return
    }

    if (!share.carts || share.carts.length === 0) {
      alert("Giỏ hàng trống!")
      return
    }

    if (!validateForm()) {
      alert("Vui lòng kiểm tra lại thông tin!")
      return
    }

    for (const item of share.carts) {
      try {
        const resProduct = await api.get(`/products/${item.product.id}`);
        const currentStock = resProduct.data.stock;

        if (item.quantity > currentStock) {
          alert(`Sản phẩm "${item.product.name}" hiện chỉ còn ${currentStock} cái.`);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi check tồn kho:", err);
        alert("Không kiểm tra được tồn kho sản phẩm: " + item.product.name);
        return;
      }
    }

    const subtotal = totalCart.value
    const vat = Math.round(subtotal * 0.1)
    const total = subtotal + vat

    // Tạo ID đơn hàng
    const orderId = Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

    const order = {
      id: orderId,
      userId: userLocal.id,
      fullname: formUser.fullname,
      email: formUser.username,
      phone: checkoutForm.phone,
      address: checkoutForm.address,
      note: checkoutForm.note || "",
      payment: "COD",
      status: "pending",
      subtotal,
      vat,
      total,
      createdAt: new Date().toISOString()
    }

    await api.post(`/orders`, order)

    for (const item of share.carts) {
      await api.post(`/orderItems`, {
        orderId: orderId,
        productId: item.product.id,
        price: item.product.price,
        quantity: item.quantity
      })
    }

    for (const item of share.carts) {
      const productId = item.product.id;

      // Lấy sản phẩm hiện tại
      const res = await api.get(`/products/${productId}`);
      const currentProduct = res.data;

      const newStock = currentProduct.stock - item.quantity;

      // Không cho âm
      const finalStock = newStock < 0 ? 0 : newStock;

      await api.put(`/products/${productId}`, {
        ...currentProduct,
        stock: finalStock
      });
    }

    // Xóa giỏ hàng
    for (const item of share.carts) {
      await api.delete(`/carts/${item.id}`)
    }

    share.carts = []

    alert("Đặt hàng thành công! 🎉")
    router.push("/")

  } catch (err) {
    console.error(err)
    alert("Có lỗi xảy ra khi đặt hàng")
  }
}
</script>
<template>
  <main class="container my-5">
    <div class="row g-4">
      <!-- Left: Form -->
      <div class="col-lg-8">
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <p class="section-title mb-2">Thông tin liên hệ</p>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Tên</label>
                <input v-model="formUser.fullname" type="text" class="form-control" required />
                <p v-if="errors.fullname" class="text-danger small">{{ errors.fullname }}</p>
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="formUser.username" type="email" class="form-control" required />
                <p v-if="errors.email" class="text-danger small">{{ errors.email }}</p>
              </div>
              <div class="col-md-6">
                <label class="form-label">Số điện thoại</label>
                <input v-model="checkoutForm.phone" type="tel" class="form-control" placeholder="09.." />
                <p v-if="errors.phone" class="text-danger small">{{ errors.phone }}</p>
              </div>
            </div>

            <hr class="my-4" />
            <p class="section-title mb-2">Địa chỉ giao hàng</p>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Địa chỉ</label>
                <input v-model="checkoutForm.address" type="text" class="form-control" required />
                <p v-if="errors.address" class="text-danger small">{{ errors.address }}</p>
              </div>
              <div class="col-12">
                <label class="form-label">ghi chú</label>
                <input v-model="checkoutForm.note" type="text" class="form-control" required />
              </div>
              <div class="col-12">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="same-address" checked />
                  <label class="form-check-label" for="same-address">
                    Sử dụng địa chỉ này cho thanh toán
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-body">
            <p class="section-title mb-2">Phương thức thanh toán</p>
            <div class="row gy-3">
              <div class="col-md-4">
                <div class="form-check border rounded-3 p-3 h-100">
                  <input class="form-check-input" type="radio" name="paymentMethod" id="zalopay" checked />
                  <label class="form-check-label d-block" for="zalopay">
                    COD
                  </label>
                  <small class="text-muted">Thanh toán khi nhận hàng</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-check border rounded-3 p-3 h-100">
                  <input class="form-check-input" type="radio" name="paymentMethod" id="momo" />
                  <label class="form-check-label d-block" for="momo">
                    MoMo Pay
                  </label>
                  <small class="text-muted">Nhập mã đơn hoặc quét QR trên MoMo.</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-check border rounded-3 p-3 h-100">
                  <input class="form-check-input" type="radio" name="paymentMethod" id="vnpay" />
                  <label class="form-check-label d-block" for="vnpay">
                    VNPay
                  </label>
                  <small class="text-muted">Hỗ trợ chuyển khoản qua VNPay QR.</small>
                </div>
              </div>
            </div>

            <div class="alert alert-info mt-3" role="alert">
              Sau khi bấm "Đặt hàng", mã QR tương ứng sẽ hiển thị để bạn quét bằng ví điện tử. Giao dịch an toàn, xác
              nhận trong vòng 1 phút.
            </div>

            <div class="row g-3 mt-1">
              <div class="col-12 mt-2">
                <a href="cart.html" class="btn btn-outline-secondary me-2">
                  ← Quay lại giỏ hàng
                </a>
                <button @click="placeOrder" class="btn btn-primary">
                  Đặt hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Order summary -->
      <div class="col-lg-4">
        <div class="card shadow-sm mb-3">
          <div class="card-body">
            <h2 class="h5 mb-3">Tóm tắt đơn hàng</h2>

            <ul v-for="c in share.carts" :key="c.id" class="list-group list-group-flush mb-3">
              <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                <div>
                  <strong>{{ c.product?.name }}</strong>
                  <p class="mb-0 small text-muted">{{ c.quantity }}</p>
                </div>
                <span>{{ c.product?.price * c.quantity }}</span>
              </li>
            </ul>
            <div class="d-flex justify-content-between mb-2">
              <span>Tạm tính</span>
              <span>{{ totalCart }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Phí vận chuyển</span>
              <span>Miễn phí</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Thuế</span>
              <span>{{ Math.round(totalCart * 0.1, 2) }} đ</span>
            </div>
            <hr />
            <div class="d-flex justify-content-between fw-bold mb-0">
              <span>Tổng cộng</span>
              <span>{{ totalCart + Math.round(totalCart * 0.1, 2) }} đ</span>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-body">
            <h2 class="h6">Cần hỗ trợ?</h2>
            <p class="text-muted small mb-3">
              Đội ngũ chăm sóc hoạt động 24/7 để giải đáp mọi thắc mắc giao hàng hoặc thanh toán.
            </p>
            <ul class="list-unstyled mb-0 small">
              <li>• Chat trực tuyến bất kỳ lúc nào</li>
              <li>• Email: support@simplecart.vn</li>
              <li>• Hotline: 1900 123 456</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>

</template>
<style scoped>
.success {
  color: green;
}
</style>
