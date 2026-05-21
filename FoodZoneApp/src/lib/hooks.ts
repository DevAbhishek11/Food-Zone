import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api';
import type { ApiEnvelope, AppNotification, Order, Post, Review, User, Vendor, VendorMenu } from './types';

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
  items: { item_id: number; quantity: number }[];
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => api.post<Order>('/orders', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
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
