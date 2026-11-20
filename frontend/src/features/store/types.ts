export interface ProductVariantCard {
  id: string;
  sku: string;
  variant_name: string;
  selling_price: string | number;
  mrp: string | number;
  discount_percentage: number;
  stock_quantity: string | number;
  is_in_stock: boolean;
}

export interface ProductCard {
  id: string;
  name: string;
  code: string;
  sku?: string;
  unit?: string;
  category_id?: string | null;
  category_name?: string | null;
  brand_name?: string | null;
  description?: string | null;
  selling_price: string | number;
  mrp: string | number;
  discount_percentage: number;
  in_stock: boolean;
  available_stock?: number;
  variants: ProductVariantCard[];
  image_url?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  product_count: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_variant_id: string;
  variant_name: string;
  sku: string;
  quantity: string | number;
  unit_price: string | number;
  mrp: string | number;
  total_price: string | number;
  total_savings: string | number;
  in_stock: boolean;
  available_stock: string | number;
}

export interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  total_items: number;
  subtotal: string | number;
  total_mrp: string | number;
  total_savings: string | number;
  estimated_tax: string | number;
  grand_total: string | number;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItemDetail {
  id: string;
  product_name: string;
  sku: string;
  quantity: string | number;
  unit_price: string | number;
  discount_amount: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  total_amount: string | number;
}

export interface OrderTimelineItem {
  id: string;
  old_status?: string | null;
  new_status: string;
  notes?: string | null;
  created_at: string;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  order_type: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  delivery_charge: string | number;
  total_amount: string | number;
  shipping_recipient_name?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_landmark?: string | null;
  delivery_slot?: string | null;
  delivery_notes?: string | null;
  payment_method: string;
  payment_status: string;
  placed_at?: string | null;
  confirmed_at?: string | null;
  packed_at?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  items: OrderItemDetail[];
  timeline: OrderTimelineItem[];
}

export interface CustomerOrderSummary {
  id: string;
  order_number: string;
  order_date?: string;
  status: string;
  order_status?: string;
  total_amount: string | number;
  item_count?: number;
  total_items?: number;
  payment_method: string;
  payment_status: string;
  delivery_slot?: string | null;
  created_at: string;
}

export interface OrderPreview {
  subtotal: string | number;
  cgst: string | number;
  sgst: string | number;
  igst: string | number;
  total_tax: string | number;
  delivery_charge: string | number;
  grand_total: string | number;
  total_items: number;
}
