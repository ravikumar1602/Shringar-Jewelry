import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { ordersAPI } from '../../services/api';
import { COLORS, formatCurrency, formatDateTime, STATUS_CONFIG } from '../../utils/helpers';

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params;
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getOne(orderId).then(r => setOrder(r.data.data.order)).catch(console.error).finally(() => setLoading(false));
  }, [orderId]);

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          const res = await ordersAPI.cancel(orderId, 'Cancelled by customer');
          setOrder(res.data.data.order);
          Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
        } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Cancellation failed'); }
      }},
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />;
  if (!order) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Order not found</Text></View>;

  const statusConf = STATUS_CONFIG[order.status] || { label: order.status, color: '#6B7280', bg: '#F3F4F6' };
  const canCancel  = ['pending', 'confirmed'].includes(order.status);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Status Banner */}
      <View style={[s.statusBanner, { backgroundColor: statusConf.bg }]}>
        <Text style={[s.statusLabel, { color: statusConf.color }]}>● {statusConf.label}</Text>
        <Text style={s.orderNum}>Order #{order.orderNumber}</Text>
        <Text style={s.orderDate}>{formatDateTime(order.createdAt)}</Text>
      </View>

      {/* Tracking */}
      {order.trackingHistory?.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>📍 Tracking History</Text>
          {order.trackingHistory.map((event, i) => (
            <View key={i} style={s.trackRow}>
              <View style={s.trackDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.trackStatus}>{event.status?.replace(/_/g, ' ')}</Text>
                <Text style={s.trackMsg}>{event.message}</Text>
                <Text style={s.trackDate}>{formatDateTime(event.timestamp)}</Text>
              </View>
            </View>
          ))}
          {order.trackingNumber && (
            <View style={s.trackingInfo}>
              <Text style={s.trackingLabel}>Courier: <Text style={{ fontWeight: '600' }}>{order.courierName}</Text></Text>
              <Text style={s.trackingLabel}>AWB: <Text style={{ fontWeight: '600', color: COLORS.primary }}>{order.trackingNumber}</Text></Text>
            </View>
          )}
        </View>
      )}

      {/* Items */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📦 Items Ordered</Text>
        {order.items?.map((item, i) => (
          <View key={i} style={s.itemRow}>
            {item.image && <Image source={{ uri: item.image }} style={s.itemImg} />}
            <View style={{ flex: 1 }}>
              <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.itemMeta}>Qty: {item.quantity} × {formatCurrency(item.price)}</Text>
            </View>
            <Text style={s.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
        ))}
      </View>

      {/* Address */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📍 Delivery Address</Text>
        <Text style={s.addrName}>{order.shippingAddress?.fullName}</Text>
        <Text style={s.addrLine}>{order.shippingAddress?.addressLine1}</Text>
        {order.shippingAddress?.addressLine2 && <Text style={s.addrLine}>{order.shippingAddress.addressLine2}</Text>}
        <Text style={s.addrLine}>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</Text>
        <Text style={s.addrLine}>📞 {order.shippingAddress?.phone}</Text>
      </View>

      {/* Payment */}
      <View style={s.card}>
        <Text style={s.cardTitle}>💳 Payment Details</Text>
        {[
          ['Method', order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'],
          ['Status', order.paymentStatus],
          ['Subtotal', formatCurrency(order.subtotal)],
          ['Shipping', order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)],
          ...(order.discountAmount > 0 ? [['Discount', `- ${formatCurrency(order.discountAmount)}`]] : []),
          ...(order.taxAmount > 0 ? [['GST', formatCurrency(order.taxAmount)]] : []),
        ].map(([k, v]) => (
          <View key={k} style={s.summRow}>
            <Text style={s.summKey}>{k}</Text>
            <Text style={[s.summVal, k === 'Discount' && { color: '#10B981' }]}>{v}</Text>
          </View>
        ))}
        <View style={[s.summRow, s.totalRow]}>
          <Text style={s.totalKey}>Total Paid</Text>
          <Text style={s.totalVal}>{formatCurrency(order.totalAmount)}</Text>
        </View>
      </View>

      {/* Actions */}
      {canCancel && (
        <TouchableOpacity onPress={handleCancel} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  statusBanner: { padding: 20, marginBottom: 4 },
  statusLabel:  { fontSize: 14, fontWeight: '700', textTransform: 'capitalize', marginBottom: 4 },
  orderNum:     { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  orderDate:    { fontSize: 12, color: '#6B7280' },
  card:         { backgroundColor: '#fff', margin: 8, borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: .04, shadowRadius: 4 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  trackRow:     { flexDirection: 'row', gap: 12, marginBottom: 12 },
  trackDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginTop: 4 },
  trackStatus:  { fontSize: 13, fontWeight: '600', color: '#1A1A2E', textTransform: 'capitalize' },
  trackMsg:     { fontSize: 12, color: '#6B7280', marginTop: 2 },
  trackDate:    { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  trackingInfo: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginTop: 4 },
  trackingLabel:{ fontSize: 13, color: '#374151', marginBottom: 2 },
  itemRow:      { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImg:      { width: 56, height: 56, borderRadius: 8 },
  itemName:     { fontSize: 13, fontWeight: '600', color: '#1A1A2E', lineHeight: 18 },
  itemMeta:     { fontSize: 12, color: '#6B7280', marginTop: 4 },
  itemTotal:    { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  addrName:     { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  addrLine:     { fontSize: 13, color: '#374151', lineHeight: 20 },
  summRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summKey:      { fontSize: 14, color: '#6B7280' },
  summVal:      { fontSize: 14, color: '#374151', fontWeight: '500', textTransform: 'capitalize' },
  totalRow:     { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginTop: 4, marginBottom: 0 },
  totalKey:     { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  totalVal:     { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  cancelBtn:    { margin: 12, borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelText:   { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});
