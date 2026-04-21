import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { authAPI } from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { updateLocalUser } from '../../store/slices/authSlice';
import { COLORS, formatCurrency } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ProductSkeleton } from '../../components/SkeletonLoader';

export default function WishlistScreen({ navigation }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading]   = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    authAPI.getMe()
      .then(r => setWishlist(r.data.data.user.wishlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRetry = () => {
    setLoading(true);
    authAPI.getMe()
      .then(r => setWishlist(r.data.data.user.wishlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleRemove = async (productId) => {
    try {
      const res = await authAPI.toggleWishlist(productId);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      dispatch(updateLocalUser({ wishlist: res.data.data.wishlist }));
    } catch {}
  };

  const handleAddToCart = async (product) => {
    const result = await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    if (addToCart.fulfilled.match(result))
      Alert.alert('Added!', `${product.name} added to cart`, [
        { text: 'Continue' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    else Alert.alert('Error', result.payload || 'Could not add to cart');
  };

  if (loading) {
    return (
      <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
      </View>
    );
  }

  if (!wishlist.length) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: 32 }}>
      <View style={s.emptyIconBox}>
        <Ionicons name="heart-outline" size={64} color={COLORS.primary} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginTop: 16 }}>Wishlist is Empty</Text>
      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, marginTop: 8, textAlign: 'center' }}>Tap the heart icon on any product to save it here</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={handleRetry} style={{ backgroundColor: '#1A1A2E', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 }} activeOpacity={0.7}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 }} activeOpacity={0.7}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={wishlist}
      keyExtractor={i => i._id}
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      numColumns={2}
      columnWrapperStyle={{ gap: 10 }}
      renderItem={({ item: p }) => {
        const img = p.images?.find(i => i.isMain) || p.images?.[0];
        const discount = p.comparePrice > p.price ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
        return (
          <View style={s.card}>
            <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { productId: p._id })}>
              <View style={s.imgBox}>
                {img?.url ? <Image source={{ uri: img.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Ionicons name="diamond" size={36} color="#9CA3AF" />}
                {discount > 0 && <View style={s.badge}><Text style={s.badgeText}>{discount}%</Text></View>}
              </View>
              <View style={{ padding: 10 }}>
                <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                <Text style={s.price}>{formatCurrency(p.price)}</Text>
              </View>
            </TouchableOpacity>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => handleAddToCart(p)} style={s.cartBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="cart" size={12} color="#fff" />
                  <Text style={s.cartBtnText}>Add</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemove(p._id)} style={s.removeBtn}>
                <Ionicons name="heart-dislike" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(200,169,110,0.1)', justifyContent: 'center', alignItems: 'center' },
  card:    { flex: 1, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: .05, shadowRadius: 4 },
  imgBox:  { height: 150, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge:   { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText:{ color: '#fff', fontSize: 9, fontWeight: '700' },
  name:    { fontSize: 12, fontWeight: '600', color: '#1A1A2E', lineHeight: 17, marginBottom: 4 },
  price:   { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 8, gap: 6, alignItems: 'center' },
  cartBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, padding: 7, alignItems: 'center' },
  cartBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  removeBtn: { padding: 6 },
});
