// ──────────────── CheckoutScreen.jsx ────────────────
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { ordersAPI } from '../../services/api';
import { COLORS, formatCurrency } from '../../utils/helpers';

export default function CheckoutScreen({ navigation }) {
  const { user }  = useSelector(s => s.auth);
  const { cart }  = useSelector(s => s.cart);
  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault)?._id || user?.addresses?.[0]?._id || null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  const subtotal  = cart?.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const shipping  = subtotal >= 999 ? 0 : 99;
  const discount  = cart?.couponDiscount || 0;
  const total     = subtotal + shipping - discount;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return Alert.alert('Select Address', 'Please select a delivery address');
    setLoading(true);
    try {
      const res = await ordersAPI.create({ shippingAddressId: selectedAddress, paymentMethod });
      const order = res.data.data.order;

      if (paymentMethod === 'cod') {
        Alert.alert('Order Placed! 🎉', `Your order #${order.orderNumber} has been placed.\nCash on Delivery selected.`, [
          { text: 'View Order', onPress: () => navigation.replace('OrderDetail', { orderId: order._id }) },
        ]);
      } else {
        navigation.navigate('Payment', { orderId: order._id, orderNumber: order.orderNumber, amount: order.totalAmount });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Delivery Address */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📍 Delivery Address</Text>
        {user?.addresses?.length === 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Addresses')} style={s.addAddrBtn}>
            <Text style={s.addAddrText}>+ Add Delivery Address</Text>
          </TouchableOpacity>
        )}
        {user?.addresses?.map(addr => (
          <TouchableOpacity key={addr._id} onPress={() => setSelectedAddress(addr._id)}
            style={[s.addrCard, selectedAddress === addr._id && s.addrCardActive]}>
            <View style={[s.radio, selectedAddress === addr._id && s.radioActive]} />
            <View style={{ flex: 1 }}>
              <Text style={s.addrName}>{addr.fullName} • {addr.label}</Text>
              <Text style={s.addrText}>{addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}</Text>
              <Text style={s.addrText}>{addr.state} - {addr.pincode}</Text>
              <Text style={s.addrPhone}>📞 {addr.phone}</Text>
            </View>
            {addr.isDefault && <Text style={s.defaultTag}>Default</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment Method */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>💳 Payment Method</Text>
        {[
          { id: 'razorpay', icon: '💳', label: 'Online Payment', sub: 'UPI, Cards, Net Banking (via Razorpay)' },
          { id: 'cod',      icon: '💵', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
        ].map(pm => (
          <TouchableOpacity key={pm.id} onPress={() => setPaymentMethod(pm.id)}
            style={[s.pmCard, paymentMethod === pm.id && s.pmCardActive]}>
            <View style={[s.radio, paymentMethod === pm.id && s.radioActive]} />
            <Text style={{ fontSize: 24, marginRight: 10 }}>{pm.icon}</Text>
            <View>
              <Text style={s.pmLabel}>{pm.label}</Text>
              <Text style={s.pmSub}>{pm.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order Summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📦 Order Summary ({cart?.totalItems} items)</Text>
        {cart?.items?.map(item => (
          <View key={item._id} style={s.orderItem}>
            <Text style={s.orderItemName} numberOfLines={1}>{item.name} × {item.quantity}</Text>
            <Text style={s.orderItemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={s.divider} />
        {[['Subtotal', formatCurrency(subtotal)], ['Shipping', shipping === 0 ? 'FREE' : formatCurrency(shipping)], ...(discount > 0 ? [['Discount', `- ${formatCurrency(discount)}`]] : [])].map(([k, v]) => (
          <View key={k} style={s.summRow}><Text style={s.summKey}>{k}</Text><Text style={[s.summVal, k === 'Discount' && { color: '#10B981' }]}>{v}</Text></View>
        ))}
        <View style={[s.summRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700' }}>Total</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={handlePlaceOrder} disabled={loading} style={[s.placeBtn, loading && { backgroundColor: '#9CA3AF' }]}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.placeBtnText}>{paymentMethod === 'cod' ? '📦 Place Order (COD)' : `💳 Proceed to Pay ${formatCurrency(total)}`}</Text>}
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.bg },
  section:       { backgroundColor: '#fff', margin: 12, borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: .04, shadowRadius: 4 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  addAddrBtn:    { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, borderStyle: 'dashed', padding: 14, alignItems: 'center' },
  addAddrText:   { color: COLORS.primary, fontWeight: '600' },
  addrCard:      { flexDirection: 'row', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 8, alignItems: 'flex-start', gap: 12 },
  addrCardActive:{ borderColor: COLORS.primary, backgroundColor: '#FFF9F0' },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#D1D5DB', marginTop: 2 },
  radioActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  addrName:      { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  addrText:      { fontSize: 13, color: '#374151', lineHeight: 18 },
  addrPhone:     { fontSize: 12, color: '#6B7280', marginTop: 2 },
  defaultTag:    { fontSize: 10, color: COLORS.primary, fontWeight: '600', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pmCard:        { flexDirection: 'row', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 8, alignItems: 'center', gap: 8 },
  pmCardActive:  { borderColor: COLORS.primary, backgroundColor: '#FFF9F0' },
  pmLabel:       { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  pmSub:         { fontSize: 12, color: '#6B7280', marginTop: 2 },
  orderItem:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  orderItemName: { fontSize: 13, color: '#374151', flex: 1 },
  orderItemPrice:{ fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  divider:       { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  summRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summKey:       { fontSize: 14, color: '#6B7280' },
  summVal:       { fontSize: 14, fontWeight: '500', color: '#374151' },
  placeBtn:      { backgroundColor: COLORS.primary, margin: 12, borderRadius: 14, padding: 16, alignItems: 'center' },
  placeBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
