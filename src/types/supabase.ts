
// Tipos personalizados para trabalhar com o Supabase

// Tipo para usuários/perfis
export interface Profile {
  id: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role?: 'admin' | 'restaurant_owner' | 'manager' | 'waiter' | 'chef' | 'delivery_person' | 'customer';
  created_at?: string;
  avatar_url?: string | null;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  } | null;
}

// Tipo para restaurantes
export interface Restaurant {
  id: number;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  address?: string | null;
  coordinates?: any; // Tipo geografia do PostGIS
  opening_hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    }
  } | null;
  phone?: string | null;
  categories?: string[];
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Tipo para categorias
export interface Category {
  id: number;
  name: string;
  restaurant_id: number;
  created_at?: string;
}

// Tipo para produtos
export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  restaurant_id: number;
  category?: string | null; // Adicionando a propriedade category que está faltando
  category_id?: number | null;
  available: boolean;
  featured?: boolean;
  nutritional_info?: any | null;
  preparation_time?: number | null;
  created_at?: string;
  updated_at?: string;
  images?: string[];
}

// Tipo para opções de produtos
export interface ProductOption {
  id: number;
  product_id: number;
  name: string;
  price: number;
  available: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tipo para mesas
export interface Table {
  id: number;
  restaurant_id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  qr_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Tipo para pedidos
export interface Order {
  id: number;
  restaurant_id: number;
  user_id?: string | null;
  table_id?: number | null;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  order_type: 'in_store' | 'delivery' | 'pickup';
  total: number;
  delivery_address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  } | null;
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'mercado_pago' | null;
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_person_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Tipo para itens de pedido
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  options?: {
    option_id: number;
    name: string;
    price: number;
  }[] | null;
  notes?: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// Tipo para mensagens
export interface Message {
  id: number;
  order_id?: number | null;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at?: string;
}

// Tipo para avaliações de produtos
export interface ProductReview {
  id: number;
  product_id: number;
  user_id: string;
  order_id?: number | null;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string | null;
  created_at?: string;
}

// Tipo para rastreamento de entrega
export interface DeliveryTracking {
  id: number;
  order_id: number;
  delivery_person_id?: string | null;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  current_location?: any | null; // Tipo geografia do PostGIS
  estimated_delivery_time?: string | null;
  actual_delivery_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Tipo para usuário atual com função
export interface CurrentUser {
  id: string;
  role: 'admin' | 'restaurant_owner' | 'manager' | 'waiter' | 'chef' | 'delivery_person' | 'customer' | 'visitor';
  name?: string;
  email?: string | null;
  avatar_url?: string | null;
}

// Interface MenuItem para uso no carrinho e outros componentes
export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  imageUrl?: string; // Para compatibilidade com código existente
  category?: string;
  quantity?: number;
  notes?: string;
}
