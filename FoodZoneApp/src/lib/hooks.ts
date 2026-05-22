import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api';
import type { Address, ApiEnvelope, AppNotification, OperatingHour, Order, Post, Review, User, Vendor, VendorMenu } from './types';

export interface AddressInput {
  label?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default?: boolean;
}

function nextPage<T>(last: ApiEnvelope<T>) {
  return last.meta?.has_more ? last.meta.current_page + 1 : undefined;
}

export interface CombinedSearch {
  users: User[];
  vendors: Vendor[];
  posts: Post[];
}

export function useCombinedSearch(q: string) {
  return useQuery({
    queryKey: ['search', 'all', q],
    enabled: q.trim().length >= 2,
    queryFn: () => api.get<CombinedSearch>('/search', { query: { q } }),
    select: (e) => e.data,
  });
}

export function useTypedSearch(q: string, type: 'users' | 'vendors' | 'posts') {
  return useInfiniteQuery({
    queryKey: ['search', type, q],
    enabled: q.trim().length >= 2,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<(User | Vendor | Post)[]>('/search', { query: { q, type, page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>('/feed', { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<Post>('/posts', { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useVendors(q: string) {
  return useInfiniteQuery({
    queryKey: ['vendors', q],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Vendor[]>('/vendors', { query: { page: pageParam, q: q || undefined } }),
    getNextPageParam: nextPage,
  });
}

export function useVendorMenu(idOrSlug: string) {
  return useQuery({
    queryKey: ['vendor-menu', idOrSlug],
    queryFn: () => api.get<VendorMenu>(`/vendors/${idOrSlug}/menu`),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['vendor-menu'] });
    qc.invalidateQueries({ queryKey: ['vendors'] });
  };
  const favorite = useMutation({ mutationFn: (vendorId: number) => api.post(`/vendors/${vendorId}/favorite`), onSuccess: invalidate });
  const unfavorite = useMutation({ mutationFn: (vendorId: number) => api.del(`/vendors/${vendorId}/favorite`), onSuccess: invalidate });
  return { favorite, unfavorite };
}

export function useReorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => api.post<Order>(`/orders/${orderId}/reorder`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useVendorReviews(idOrSlug: string) {
  return useInfiniteQuery({
    queryKey: ['vendor-reviews', idOrSlug],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Review[]>(`/vendors/${idOrSlug}/reviews`, { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useRateOrder(orderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; review?: string }) => api.post(`/orders/${orderId}/rate`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export interface PlaceOrderInput {
  vendor_id: number;
  payment_method: 'cod' | 'upi' | 'card' | 'wallet';
  address_id?: number;
  items: { item_id: number; quantity: number }[];
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => api.post<Order>('/orders', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useAddresses() {
  return useQuery({ queryKey: ['addresses'], queryFn: () => api.get<Address[]>('/addresses'), select: (e) => e.data });
}

export function useSaveAddress() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses'] });
  const create = useMutation({ mutationFn: (body: AddressInput) => api.post<Address>('/addresses', body), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: AddressInput }) => api.put<Address>(`/addresses/${id}`, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: number) => api.del(`/addresses/${id}`), onSuccess: invalidate });
  return { create, update, remove };
}

export function useOrders() {
  return useInfiniteQuery({
    queryKey: ['orders'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Order[]>('/orders', { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get<{ unread: number }>('/notifications/unread-count'),
    refetchInterval: 30_000,
    select: (env) => env.data.unread,
  });
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<AppNotification[]>('/notifications', { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useClearNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.del('/notifications'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => api.get<User>(`/users/${username}`),
    select: (env) => env.data,
  });
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ['user-posts', username],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Post[]>(`/users/${username}/posts`, { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useToggleFollow(username: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['user', username] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };
  const follow = useMutation({
    mutationFn: (userId: number) => api.post(`/users/${userId}/follow`),
    onSuccess: invalidate,
  });
  const unfollow = useMutation({
    mutationFn: (userId: number) => api.del(`/users/${userId}/follow`),
    onSuccess: invalidate,
  });
  return { follow, unfollow };
}

// ---- Vendor management -----------------------------------------------------

export interface VendorStats {
  is_open: boolean;
  pending_orders: number;
  active_orders: number;
  orders_today: number;
  revenue_today: number;
  total_orders: number;
  rating_avg: number;
  rating_count: number;
  menu_items: number;
}

export function useVendorStats() {
  return useQuery({
    queryKey: ['vendor-stats'],
    queryFn: () => api.get<VendorStats>('/vendor/stats'),
    select: (e) => e.data,
  });
}

export function useToggleStoreOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (is_open: boolean) => api.post('/vendor/store/toggle-open', { is_open }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-stats'] }),
  });
}

export function useVendorOrders() {
  return useInfiniteQuery({
    queryKey: ['vendor-orders'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Order[]>('/vendor/orders', { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.post(`/vendor/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-orders'] });
      qc.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

export function useVendorReviewsAdmin() {
  return useInfiniteQuery({
    queryKey: ['vendor-reviews-admin'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Review[]>('/vendor/reviews', { query: { page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ratingId, reply }: { ratingId: number; reply: string }) =>
      api.post(`/vendor/reviews/${ratingId}/reply`, { reply }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-reviews-admin'] }),
  });
}

export function useVendorHours() {
  return useQuery({ queryKey: ['vendor-hours'], queryFn: () => api.get<OperatingHour[]>('/vendor/hours'), select: (e) => e.data });
}

export function useUpdateHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hours: OperatingHour[]) => api.put('/vendor/hours', { hours }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-hours'] }),
  });
}

export function useOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: ['order-detail', orderId],
    enabled: orderId != null,
    queryFn: () => api.get<Order>(`/orders/${orderId}`),
    select: (e) => e.data,
  });
}

// ---- Admin -----------------------------------------------------------------

export interface AdminStats {
  users_total: number;
  users_new_today: number;
  vendors_total: number;
  vendors_approved: number;
  vendors_pending: number;
  orders_total: number;
  orders_today: number;
  posts_total: number;
  revenue_today: number;
  commission_today: number;
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<AdminStats>('/admin/dashboard'),
    select: (e) => e.data,
  });
}

export function useAdminVendors(status?: string) {
  return useInfiniteQuery({
    queryKey: ['admin-vendors', status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Vendor[]>('/admin/vendors', { query: { status, page: pageParam } }),
    getNextPageParam: nextPage,
  });
}

export function useVendorModeration() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-vendors'] });
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };
  const approve = useMutation({ mutationFn: (id: number) => api.put(`/admin/vendors/${id}/approve`), onSuccess: invalidate });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.put(`/admin/vendors/${id}/reject`, { reason }),
    onSuccess: invalidate,
  });
  return { approve, reject };
}
