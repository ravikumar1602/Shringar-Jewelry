import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon, removeCoupon, clearCouponMessage } from '../../store/slices/cartSlice';
import { COLORS, formatCurrency } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

function CartItem({ item, onUpdate, onRemove }) {
  return (
    <View style={s.item}>
      <View style={s.itemImg}>
        {item.image ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Ionicons name="diamond" size={28} color="#9CA3AF" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={s.itemPrice}>{formatCurrency(item.price)}</Text>
        <View style={s.qtyRow}>
          <TouchableOpacity onPress={() => onUpdate(item._id, item.quantity - 1)} style={s.qBtn}><Text style={s.qBtnText}>−</Text></TouchableOpacity>
          <Text style={s.qVal}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => onUpdate(item._id, item.quantity + 1)} style={s.qBtn}><Text style={s.qBtnText}>+</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(item._id)} style={s.removeBtn}><Ionicons name="trash" size={16} color="#DC2626" /></TouchableOpacity>
        </View>
      </View>
      <Text style={s.lineTotal}>{formatCurrency(item.price * item.quantity)}</Text>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const { cart, loading, couponMessage } = useSelector(s => s.cart);
  const { isAuthenticated } = useSelector(s => s.auth);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) dispatch(fetchCart()); }, [isAuthenticated]);

  useEffect(() => {
    if (couponMessage) {
      Alert.alert('Coupon Applied!', couponMessage);
      dispatch(clearCouponMessage());
    }
  }, [couponMessage]);

  const handleUpdate = async (itemId, qty) => {
    if (qty === 0) {
      Alert.alert('Remove Item?', 'Remove this item from cart?', [
        { text: 'Cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeFromCart(itemId)) },
      ]);
    } else dispatch(updateCartItem({ itemId, quantity: qty }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await dispatch(applyCoupon(couponCode.trim().toUpperCase()));
    if (applyCoupon.rejected.match(result)) Alert.alert('Invalid Coupon', result.payload || 'Coupon not valid');
    setCouponLoading(false);
    setCouponCode('');
  };

  const handleRemoveCoupon = () => dispatch(removeCoupon());

  if (!cart || cart.items?.length === 0) {
    return (
      <View style={s.emptyContainer}>
        <View style={s.emptyIconBox}>
          <Ionicons name="cart-outline" size={80} color={COLORS.primary} />
        </View>
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.emptySubtitle}>Explore our beautiful jewelry collection</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={s.shopBtn} activeOpacity={0.7}>
          <Text style={s.shopBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = cart.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const discount = cart.couponDiscount || 0;
  const total    = subtotal + shipping - discount;

  return (
    <View style={s.container}>
      <FlatList
        data={cart.items}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item }) => (
          <CartItem item={item} onUpdate={handleUpdate} onRemove={(id) => dispatch(removeFromCart(id))} />
        )}
        ListFooterComponent={
          <View>
            {/* Coupon */}
            <View style={s.couponBox}>
              {cart.couponCode ? (
                <View style={s.couponApplied}>
                  <Text style={s.couponText}>Coupon: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{cart.couponCode}</Text> applied!</Text>
                  <TouchableOpacity onPress={handleRemoveCoupon}><Text style={{ color: '#DC2626', fontSize: 13 }}>Remove</Text></TouchableOpacity>
                </View>
              ) : (
                <View style={s.couponRow}>
                  <TextInput value={couponCode} onChangeText={v => setCouponCode(v.toUpperCase())}
                    placeholder="Enter coupon code" placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters" style={s.couponInput} />
                  <TouchableOpacity onPress={handleApplyCoupon} disabled={couponLoading} style={s.couponBtn} activeOpacity={0.7}>
                    {couponLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.couponBtnText}>Apply</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Summary */}
            <View style={s.summary}>
              <Text style={s.summaryTitle}>Order Summary</Text>
              {[
                ['Subtotal', formatCurrency(subtotal)],
                ['Shipping', shipping === 0 ? 'FREE' : formatCurrency(shipping)],
                ...(discount > 0 ? [['Coupon Discount', `- ${formatCurrency(discount)}`]] : []),
              ].map(([k, v]) => (
                <View key={k} style={s.summaryRow}>
                  <Text style={s.summaryKey}>{k}</Text>
                  <Text style={[s.summaryVal, k === 'Coupon Discount' && { color: '#10B981' }]}>{v}</Text>
                </View>
              ))}
              {shipping > 0 && <Text style={s.freeShipHint}>Add {formatCurrency(999 - subtotal)} more for FREE shipping</Text>}
              <View style={[s.summaryRow, s.totalRow]}>
                <Text style={s.totalKey}>Total</Text>
                <Text style={s.totalVal}>{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>
        }
      />

      {/* Checkout button */}
      <View style={s.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Checkout')} style={s.checkoutBtn}>
          <Text style={s.checkoutText}>Proceed to Checkout →</Text>
          <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{formatCurrency(total)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.bg },
  emptyIconBox: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(200,169,110,0.1)', justifyContent: 'center', alignItems: 'center' },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginTop: 16 },
  emptySubtitle:  { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  shopBtn:        { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 24 },
  shopBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  item:           { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 12, elevation: 1, shadowColor: '#000', shadowOpacity: .05, shadowRadius: 4 },
  itemImg:        { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F3F4F6', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  itemName:       { fontSize: 13, fontWeight: '600', color: '#1A1A2E', lineHeight: 18, marginBottom: 4 },
  itemPrice:      { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qBtn:           { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qBtnText:       { fontSize: 18, fontWeight: '500', color: '#1A1A2E', lineHeight: 22 },
  qVal:           { fontSize: 15, fontWeight: '700', minWidth: 22, textAlign: 'center' },
  removeBtn:      { marginLeft: 6 },
  lineTotal:      { fontSize: 14, fontWeight: '700', color: '#1A1A2E', alignSelf: 'flex-end' },
  couponBox:      { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 0, marginBottom: 10 },
  couponRow:      { flexDirection: 'row', gap: 10 },
  couponInput:    { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1A1A2E', letterSpacing: 1 },
  couponBtn:      { backgroundColor: '#1A1A2E', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  couponBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  couponApplied:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  couponText:     { fontSize: 14, color: '#374151' },
  summary:        { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  summaryTitle:   { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey:     { fontSize: 14, color: '#6B7280' },
  summaryVal:     { fontSize: 14, fontWeight: '500', color: '#374151' },
  freeShipHint:   { fontSize: 11, color: '#10B981', marginBottom: 8 },
  totalRow:       { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalKey:       { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  totalVal:       { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  footer:         { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  checkoutBtn:    { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkoutText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
