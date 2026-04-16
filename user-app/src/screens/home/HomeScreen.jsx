import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, RefreshControl, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedProducts, fetchCategories } from '../../store/slices/productsSlice';
import { fetchCart } from '../../store/slices/cartSlice';
import { COLORS, formatCurrency } from '../../utils/helpers';

function ProductCard({ product, onPress }) {
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const image = product.images?.find(i => i.isMain) || product.images?.[0];

  return (
    <TouchableOpacity onPress={onPress} style={s.productCard}>
      <View style={s.imageBox}>
        {image?.url
          ? <Image source={{ uri: image.url }} style={s.productImg} resizeMode="cover" />
          : <Text style={{ fontSize: 40 }}>💍</Text>}
        {discount > 0 && (
          <View style={s.discountBadge}><Text style={s.discountText}>{discount}% OFF</Text></View>
        )}
        {product.isNew && (
          <View style={[s.discountBadge, { backgroundColor: '#10B981', left: 8, right: 'auto' }]}><Text style={s.discountText}>NEW</Text></View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{formatCurrency(product.price)}</Text>
          {product.comparePrice > product.price && (
            <Text style={s.comparePrice}>{formatCurrency(product.comparePrice)}</Text>
          )}
        </View>
        {product.ratingsAverage > 0 && (
          <Text style={s.rating}>⭐ {product.ratingsAverage} ({product.ratingsCount})</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function CategoryChip({ cat, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.catChip}>
      {cat.image?.url
        ? <Image source={{ uri: cat.image.url }} style={s.catImg} />
        : <Text style={{ fontSize: 28 }}>🏷️</Text>}
      <Text style={s.catName} numberOfLines={1}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const dispatch   = useDispatch();
  const { featured, categories, loading } = useSelector(s => s.products);
  const { user }   = useSelector(s => s.auth);

  const loadData = useCallback(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={[COLORS.primary]} />}>

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroGreet}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={s.heroTitle}>Find Your Perfect Jewelry</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={s.searchBar}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>🔍  Search necklaces, rings, bangles...</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories.slice(0, 8)}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={i => i._id}
            contentContainerStyle={{ paddingLeft: 16, gap: 12 }}
            renderItem={({ item }) => (
              <CategoryChip cat={item} onPress={() => navigation.navigate('Search', { categoryId: item._id, categoryName: item.name })} />
            )}
          />
        </View>
      )}

      {/* Banner */}
      <View style={s.banner}>
        <Text style={s.bannerTitle}>✨ New Collection 2025</Text>
        <Text style={s.bannerSub}>Handcrafted with love & tradition</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={s.bannerBtn}>
          <Text style={s.bannerBtnText}>Explore Now →</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Products */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>✨ Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={s.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featured}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i._id}
          contentContainerStyle={{ paddingLeft: 16, gap: 12 }}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })} />
          )}
          ListEmptyComponent={!loading && (
            <Text style={{ color: '#9CA3AF', padding: 20 }}>No featured products found</Text>
          )}
        />
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  hero:         { backgroundColor: '#1A1A2E', padding: 24, paddingTop: 16, paddingBottom: 28 },
  heroGreet:    { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  heroTitle:    { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  searchBar:    { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  section:      { paddingTop: 24, paddingBottom: 8 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  seeAll:       { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  catChip:      { alignItems: 'center', width: 76 },
  catImg:       { width: 56, height: 56, borderRadius: 28, marginBottom: 6 },
  catName:      { fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center' },
  banner:       { margin: 16, borderRadius: 16, backgroundColor: '#1A1A2E', padding: 24, overflow: 'hidden' },
  bannerTitle:  { color: COLORS.primary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  bannerSub:    { color: '#9CA3AF', fontSize: 13, marginBottom: 16 },
  bannerBtn:    { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  bannerBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  productCard:  { width: 180, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: .06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  imageBox:     { width: '100%', height: 180, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImg:   { width: '100%', height: '100%' },
  discountBadge:{ position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productName:  { fontSize: 13, fontWeight: '600', color: '#1A1A2E', lineHeight: 18 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price:        { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  comparePrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  rating:       { fontSize: 11, color: '#6B7280', marginTop: 3 },
});
