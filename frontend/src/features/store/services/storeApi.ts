import { apiClient } from "@/lib/api/client";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";
import type {
  Cart,
  CategoryItem,
  CustomerAddress,
  CustomerOrder,
  CustomerOrderSummary,
  OrderPreview,
  ProductCard,
} from "../types";

function getHeaders() {
  const token = useCustomerAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const storeApi = {
  // Auth
  async register(data: { phone: string; password: string; full_name: string; email?: string }) {
    const res = await apiClient.post("/store/auth/register", data);
    return res.data;
  },

  async login(data: { phone: string; password: string }) {
    const res = await apiClient.post("/store/auth/login", data);
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get("/store/auth/me", { headers: getHeaders() });
    return res.data;
  },

  async logout() {
    const res = await apiClient.post("/store/auth/logout", {}, { headers: getHeaders() });
    return res.data;
  },

  // Products & Categories
  async getProducts(params?: { q?: string; category_id?: string; in_stock_only?: boolean; page?: number }) {
    const res = await apiClient.get<{ items: ProductCard[]; total: number; page: number; page_size: number }>(
      "/store/products",
      { params }
    );
    return res.data;
  },

  async getCategories() {
    const res = await apiClient.get<CategoryItem[]>("/store/products/categories");
    return res.data;
  },

  async getProduct(productId: string) {
    const res = await apiClient.get<ProductCard>(`/store/products/${productId}`);
    return res.data;
  },

  async checkServiceability(pincode: string) {
    const res = await apiClient.get("/store/serviceability", { params: { pincode } });
    return res.data;
  },

  // Cart
  async getCart() {
    const res = await apiClient.get<Cart>("/store/cart", { headers: getHeaders() });
    return res.data;
  },

  async addToCart(productVariantId: string, quantity = 1) {
    const res = await apiClient.post<Cart>(
      "/store/cart/items",
      { product_variant_id: productVariantId, quantity },
      { headers: getHeaders() }
    );
    return res.data;
  },

  async updateCartItem(itemId: string, quantity: number) {
    const res = await apiClient.patch<Cart>(
      `/store/cart/items/${itemId}`,
      { quantity },
      { headers: getHeaders() }
    );
    return res.data;
  },

  async removeCartItem(itemId: string) {
    const res = await apiClient.delete<Cart>(`/store/cart/items/${itemId}`, { headers: getHeaders() });
    return res.data;
  },

  async clearCart() {
    const res = await apiClient.delete<Cart>("/store/cart", { headers: getHeaders() });
    return res.data;
  },

  // Addresses
  async getAddresses() {
    const res = await apiClient.get<CustomerAddress[]>("/store/addresses", { headers: getHeaders() });
    return res.data;
  },

  async createAddress(data: Partial<CustomerAddress>) {
    const res = await apiClient.post<CustomerAddress>("/store/addresses", data, { headers: getHeaders() });
    return res.data;
  },

  async updateAddress(addressId: string, data: Partial<CustomerAddress>) {
    const res = await apiClient.put<CustomerAddress>(`/store/addresses/${addressId}`, data, {
      headers: getHeaders(),
    });
    return res.data;
  },

  async deleteAddress(addressId: string) {
    const res = await apiClient.delete(`/store/addresses/${addressId}`, { headers: getHeaders() });
    return res.data;
  },

  async setDefaultAddress(addressId: string) {
    const res = await apiClient.post<CustomerAddress>(
      `/store/addresses/${addressId}/default`,
      {},
      { headers: getHeaders() }
    );
    return res.data;
  },

  // Orders
  async previewOrder(shippingAddressId: string, deliverySlot?: string) {
    const res = await apiClient.post<OrderPreview>(
      "/store/orders/preview",
      { shipping_address_id: shippingAddressId, delivery_slot: deliverySlot },
      { headers: getHeaders() }
    );
    return res.data;
  },

  async placeOrder(data: {
    shipping_address_id: string;
    payment_method: string;
    delivery_slot?: string;
    delivery_notes?: string;
    idempotency_key?: string;
  }) {
    const res = await apiClient.post<CustomerOrder>("/store/orders", data, { headers: getHeaders() });
    return res.data;
  },

  async getOrders(params?: { status?: string; page?: number }) {
    const res = await apiClient.get<CustomerOrderSummary[]>("/store/orders", {
      params,
      headers: getHeaders(),
    });
    return res.data;
  },

  async getOrderDetail(orderId: string) {
    const res = await apiClient.get<CustomerOrder>(`/store/orders/${orderId}`, {
      headers: getHeaders(),
    });
    return res.data;
  },

  async cancelOrder(orderId: string, reason: string) {
    const res = await apiClient.post<CustomerOrder>(
      `/store/orders/${orderId}/cancel`,
      { reason },
      { headers: getHeaders() }
    );
    return res.data;
  },
};

