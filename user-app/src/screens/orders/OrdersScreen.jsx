// OrdersScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { ordersAPI } from '../../services/api';
import { COLORS, formatCurrency, formatDate, STATUS_CONFIG } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { OrderSkeleton } from '../../components/SkeletonLoader';

export function OrdersScreen({ navigation }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);

  const load = useCallback(async (p = 1) => {
    try {
      const res = await ordersAPI.getAll({ page: p, limit: 10 });
      const { orders, pagination } = res.data.data;
      if (p === 1) setOrders(orders);
      else setOrders(prev => [...prev, ...orders]);
      setHasMore(p < pagination.pages);
      setError(null);
    } catch (err) {
      setError(err);
    } finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(1); }, []);

  const handleRefresh = () => {
    setRefresh(true);
    load(1).finally(() => setRefresh(false));
  };

  const handleRetry = () => {
    load(1);
  };

  const loadMore = () => { if (hasMore && !loading) { const next = page + 1; setPage(next); load(next); } };

  const renderOrder = ({ item: o }) => {
    const status = STATUS_CONFIG[o.status] || { label: o.status, color: '#6B7280', bg: '#F3F4F6' };
    const mainImg = o.items?.[0]?.image;
    return (
      <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: o._id })} style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.orderNum}>#{o.orderNumber}</Text>
          <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={s.cardBody}>
          {mainImg && <Image source={{ uri: mainImg }} style={s.orderImg} />}
          <View style={{ flex: 1 }}>
            <Text style={s.itemsText} numberOfLines={1}>
              {o.items?.map(i => i.name).join(', ')}
            </Text>
            <Text style={s.itemsCount}>{o.items?.length} item(s)</Text>
            <Text style={s.total}>{formatCurrency(o.totalAmount)}</Text>
          </View>
        </View>
        <View style={s.cardFooter}>
          <Text style={s.date}>Placed on {formatDate(o.createdAt)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name={o.paymentMethod === 'cod' ? 'cash' : 'card'} size={12} color={o.paymentMethod === 'cod' ? '#92400E' : '#065F46'} />
            <Text style={[s.payMethod, { color: o.paymentMethod === 'cod' ? '#92400E' : '#065F46' }]}>
              {o.paymentMethod === 'cod' ? 'COD' : 'Online'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ padding: 12, gap: 10 }}>
        <OrderSkeleton />
        <OrderSkeleton />
        <OrderSkeleton />
      </View>
    );
  }

  return (
    <FlatList data={orders} keyExtractor={i => i._id} contentContainerStyle={{ padding: 12, gap: 10 }}
      renderItem={renderOrder}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
      onEndReached={loadMore} onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <View style={s.emptyIconBox}>
            <Ionicons name="cube-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginTop: 16 }}>No Orders Yet</Text>
          <Text style={{ color: '#6B7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>Your orders will appear here once you place an order</Text>
          <TouchableOpacity onPress={handleRetry} style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 }} activeOpacity={0.7}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(200,169,110,0.1)', justifyContent: 'center', alignItems: 'center' },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: .05, shadowRadius: 4 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNum:    { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  cardBody:    { flexDirection: 'row', gap: 12, marginBottom: 10 },
  orderImg:    { width: 56, height: 56, borderRadius: 8 },
  itemsText:   { fontSize: 13, color: '#374151', fontWeight: '500', lineHeight: 18 },
  itemsCount:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  total:       { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 4 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  date:        { fontSize: 12, color: '#9CA3AF' },
  payMethod:   { fontSize: 12, fontWeight: '600' },
});

export default OrdersScreen;
