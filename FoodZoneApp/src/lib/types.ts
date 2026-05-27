// Types mirroring the FoodZone API resources (see FoodZoneServer/API.md).

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Pagination;
  errors?: Record<string, string[]>;
}

export type UserRole = 'super_admin' | 'admin' | 'vendor' | 'delivery' | 'user';

export interface UserProfile {
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  website: string | null;
  is_private: boolean;
  food_preferences: string[];
  dietary_restrictions: string[];
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: string;
  email_verified: boolean;
  referral_code: string | null;
  profile?: UserProfile | null;
  is_following?: boolean;
  is_blocked?: boolean;
  follows_me?: boolean;
}

export interface AuthPayload {
  user: User;
  token: string;
  token_type: string;
}

export interface PostAuthor {
  id: number;
  name: string;
  username: string;
  avatar?: string | null;
}

export interface PostMedia {
  id: number;
  url: string;
  type: 'image' | 'video' | 'gif';
  sort_order: number;
}

export interface Address {
  id: number;
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
}

export interface Post {
  id: number;
  body: string | null;
  type: string;
  privacy: 'public' | 'followers' | 'private';
  location: string | null;
  author: PostAuthor;
  media: PostMedia[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  liked_by_me: boolean;
  is_saved?: boolean;
  source?: 'following' | 'suggested' | 'sponsored' | null;
  created_at: string;
}

export interface Story {
  id: number;
  user_id: number;
  media_url: string;
  type: 'image' | 'video';
  caption: string | null;
  author?: PostAuthor;
  expires_at: string | null;
  created_at: string;
}

export interface StoryGroup {
  user: PostAuthor;
  is_mine: boolean;
  has_unseen: boolean;
  stories: Story[];
}

export interface Comment {
  id: number;
  post_id: number;
  parent_id: number | null;
  body: string;
  author: PostAuthor;
  likes_count?: number;
  replies_count?: number;
  replies?: Comment[];
  created_at: string;
}

export interface MenuItem {
  id: number;
  vendor_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  dietary_tags: string[];
  allergens: string[];
  is_available: boolean;
  rating_avg: number;
  variants?: { id: number; name: string; price_modifier: number; is_default: boolean }[];
  addons?: { id: number; name: string; price: number; is_available: boolean }[];
  images?: string[];
}

export interface MenuCategory {
  id: number;
  vendor_id: number;
  name: string;
  description: string | null;
  sort_order: number;
  status: string;
  items?: MenuItem[];
}

export interface Vendor {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  status: string;
  is_open: boolean;
  city: string | null;
  min_order_value: number;
  delivery_fee: number;
  prep_time_minutes: number;
  cod_enabled: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  is_favorited?: boolean;
}

export interface VendorMenu {
  vendor: Vendor;
  categories: MenuCategory[];
  uncategorized: MenuItem[];
}

export interface OrderItem {
  id: number;
  item_id: number | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  customizations?: Record<string, unknown> | null;
}

export interface ChatUser {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

export interface Conversation {
  id: number;
  other: ChatUser | null;
  last_message: { body: string; is_mine: boolean; created_at: string } | null;
  unread: number;
  last_message_at: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  body: string;
  is_mine: boolean;
  sender?: ChatUser;
  created_at: string;
}

export interface NotificationActor {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  data: {
    actor?: NotificationActor;
    post_id?: number;
    order_id?: number;
    status?: string;
    [key: string]: unknown;
  };
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  vendor_id: number;
  vendor?: { id: number; name: string; logo: string | null };
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: string;
  payable?: boolean;
  delivery_partner_id?: number | null;
  delivery_partner?: { id: number; name: string; username: string } | null;
  assigned_at?: string | null;
  picked_up_at?: string | null;
  delivery_address?: { label?: string; address?: string; city?: string; state?: string; pincode?: string } | null;
  items?: OrderItem[];
  rating?: { rating: number; review: string | null } | null;
  status_history?: { status: string; note: string | null; at: string }[];
  created_at: string;
}

export interface OperatingHour {
  id?: number;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface Review {
  id: number;
  rating: number;
  review: string | null;
  images: string[];
  user?: { id: number; name: string; username: string; avatar: string | null };
  vendor_reply: string | null;
  vendor_replied_at: string | null;
  created_at: string;
}
