import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, FlatList, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductDetail } from '../../store/slices/productsSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { authAPI } from '../../services/api';
import { COLORS, formatCurrency } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const dispatch = useDispatch();
  const { detail: product, detailLoading } = useSelector(s => s.products);
  const { loading: cartLoading } = useSelector(s => s.cart);
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [quantity, setQuantity]     = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => { dispatch(fetchProductDetail(productId)); }, [productId]);

  if (detailLoading || !product) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const images = product.images || [];
  const mainImg = images[mainImgIdx];
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const inStock = product.stock > 0 || !product.trackInventory;

  const handleAddToCart = async () => {
    if (!inStock) return Alert.alert('Out of Stock', 'This product is currently unavailable');
    const result = await dispatch(addToCart({ productId: product._id, quantity }));
    if (addToCart.fulfilled.match(result)) Alert.alert('Added!', `${product.name} added to cart`, [
      { text: 'Continue Shopping' },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ]);
    else Alert.alert('Error', result.payload || 'Could not add to cart');
  };

  const handleWishlist = async () => {
    try {
      await authAPI.toggleWishlist(product._id);
      setIsWishlisted(!isWishlisted);
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <View style={s.imgContainer}>
          {mainImg?.url
            ? <Image source={{ uri: mainImg.url }} style={s.mainImg} resizeMode="contain" />
            : <View style={s.imgPlaceholder}><Ionicons name="diamond" size={60} color="#9CA3AF" /></View>
          }
          {discount > 0 && <View style={s.discBadge}><Text style={s.discText}>{discount}% OFF</Text></View>}
          <TouchableOpacity onPress={handleWishlist} style={s.wishBtn}>
            <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? COLORS.primary : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Thumbnails */}
        {images.length > 1 && (
          <FlatList data={images} horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginVertical: 12 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => setMainImgIdx(index)}>
                <Image source={{ uri: item.url }} style={[s.thumb, mainImgIdx === index && s.thumbActive]} resizeMode="cover" />
              </TouchableOpacity>
            )} />
        )}

        <View style={s.body}>
          {/* Title + price */}
          <Text style={s.name}>{product.name}</Text>
          <Text style={s.category}>{product.category?.name}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>{formatCurrency(product.price)}</Text>
            {product.comparePrice > product.price && (
              <Text style={s.mrp}>{formatCurrency(product.comparePrice)}</Text>
            )}
            {discount > 0 && <Text style={s.savingText}>Save {formatCurrency(product.comparePrice - product.price)}</Text>}
          </View>

          {/* Rating */}
          {product.ratingsAverage > 0 && (
            <View style={s.ratingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={s.ratingBadge}>{product.ratingsAverage}</Text>
              </View>
              <Text style={s.ratingCount}>{product.ratingsCount} reviews</Text>
            </View>
          )}

          {/* Jewelry details */}
          <View style={s.detailsCard}>
            <Text style={s.detailsTitle}>Product Details</Text>
            {[
              ['Material', product.material?.replace('_', ' ').toUpperCase()],
              ['Purity',   product.purity],
              ['Gemstone', product.gemstone],
              ['Weight',   product.weight ? `${product.weight}g` : null],
              ['Gender',   product.gender?.charAt(0).toUpperCase() + product.gender?.slice(1)],
            ].filter(([, v]) => v).map(([k, v]) => (
              <View key={k} style={s.detailRow}>
                <Text style={s.detailKey}>{k}</Text>
                <Text style={s.detailVal}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.desc}>{product.description}</Text>

          {/* Stock indicator */}
          <View style={s.stockRow}>
            <View style={[s.stockDot, { backgroundColor: inStock ? '#10B981' : '#EF4444' }]} />
            <Text style={{ fontSize: 13, color: inStock ? '#065F46' : '#991B1B', fontWeight: '600' }}>
              {!product.trackInventory ? 'In Stock' : product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left!` : `In Stock (${product.stock} available)`}
            </Text>
          </View>

          {/* Quantity */}
          {inStock && (
            <View style={s.qtyRow}>
              <Text style={s.qtyLabel}>Quantity:</Text>
              <View style={s.qtyControl}>
                <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={s.qtyBtn}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyVal}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(q => Math.min(product.stock || 10, q + 1))} style={s.qtyBtn}>
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.footer}>
        <View>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>Total</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A2E' }}>{formatCurrency(product.price * quantity)}</Text>
        </View>
        <TouchableOpacity onPress={handleAddToCart} disabled={!inStock || cartLoading}
          style={[s.addBtn, (!inStock || cartLoading) && { backgroundColor: '#9CA3AF' }]} activeOpacity={0.7}>
          {cartLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.addBtnText}>{inStock ? 'Add to Cart' : 'Out of Stock'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  imgContainer: { width, height: 340, backgroundColor: '#F9FAFB', position: 'relative' },
  mainImg:      { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  discBadge:    { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  discText:     { color: '#fff', fontSize: 12, fontWeight: '700' },
  wishBtn:      { position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  thumb:        { width: 60, height: 60, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive:  { borderColor: COLORS.primary },
  body:         { padding: 20 },
  name:         { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 4, lineHeight: 28 },
  category:     { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  price:        { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  mrp:          { fontSize: 15, color: '#9CA3AF', textDecorationLine: 'line-through' },
  savingText:   { fontSize: 12, color: '#10B981', fontWeight: '600' },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingBadge:  { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 13, fontWeight: '600', color: '#92400E' },
  ratingCount:  { fontSize: 12, color: '#6B7280' },
  detailsCard:  { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 20 },
  detailsTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 10 },
  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailKey:    { fontSize: 13, color: '#6B7280' },
  detailVal:    { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  desc:         { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 16 },
  stockRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  stockDot:     { width: 8, height: 8, borderRadius: 4 },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  qtyLabel:     { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  qtyControl:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:   { fontSize: 20, fontWeight: '500', color: '#1A1A2E' },
  qtyVal:       { fontSize: 16, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  footer:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 10 },
  addBtn:       { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  addBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
