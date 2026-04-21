import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice';
import { COLORS, formatCurrency } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SORT_OPTIONS = [
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price ↑', value: 'price' },
  { label: 'Price ↓', value: '-price' },
  { label: 'Rating', value: '-ratingsAverage' },
];

function ProductItem({ product, onPress }) {
  const img = product.images?.find(i => i.isMain) || product.images?.[0];
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <TouchableOpacity onPress={onPress} style={s.item}>
      <View style={s.itemImg}>
        {img?.url ? <Image source={{ uri: img.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Ionicons name="diamond" size={30} color="#9CA3AF" />}
        {discount > 0 && <View style={s.badge}><Text style={s.badgeText}>{discount}%</Text></View>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        <Text style={s.category}>{product.category?.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.price}>{formatCurrency(product.price)}</Text>
          {product.comparePrice > product.price && <Text style={s.mrp}>{formatCurrency(product.comparePrice)}</Text>}
        </View>
        {product.ratingsAverage > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={s.rating}>{product.ratingsAverage} ({product.ratingsCount})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { list, categories, loading, pagination } = useSelector(s => s.products);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('-createdAt');
  const [category, setCategory] = useState(route.params?.categoryId || '');
  const [page, setPage]         = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!categories.length) dispatch(fetchCategories()); }, []);

  const load = useCallback(() => {
    const params = { page, limit: 20, sort };
    if (search) params.search = search;
    if (category) params.category = category;
    dispatch(fetchProducts(params));
  }, [page, sort, search, category, dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setRefreshing(true); setPage(1); load(); setRefreshing(false); };

  return (
    <View style={s.container}>
      {/* Search input */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
        <TextInput value={search} onChangeText={v => { setSearch(v); setPage(1); }} placeholder="Search jewelry..."
          placeholderTextColor="#9CA3AF" style={s.searchInput} returnKeyType="search" />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#9CA3AF" /></TouchableOpacity>}
      </View>

      {/* Category filter */}
      <FlatList data={[{ _id: '', name: 'All' }, ...categories.slice(0, 10)]} horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i._id} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => { setCategory(item._id); setPage(1); }} style={[s.chip, category === item._id && s.chipActive]}>
            <Text style={[s.chipText, category === item._id && s.chipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )} />

      {/* Sort */}
      <FlatList data={SORT_OPTIONS} horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.value} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => { setSort(item.value); setPage(1); }} style={[s.sortChip, sort === item.value && s.sortChipActive]}>
            <Text style={[s.sortText, sort === item.value && s.sortTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )} />

      {/* Count */}
      {pagination && <Text style={s.count}>{pagination.total} products found</Text>}

      {/* List */}
      {loading && page === 1
        ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList data={list} keyExtractor={i => i._id} contentContainerStyle={{ padding: 12, gap: 12 }}
            renderItem={({ item }) => (
              <ProductItem product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })} />
            )}
            ListEmptyComponent={<Text style={s.empty}>No products found</Text>}
            onEndReached={() => { if (pagination && page < pagination.pages) setPage(p => p + 1); }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loading && page > 1 ? <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} /> : null}
            refreshing={refreshing} onRefresh={handleRefresh}
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, padding: 12, fontSize: 14, color: '#1A1A2E' },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive:  { backgroundColor: '#1A1A2E', borderColor: '#1A1A2E' },
  chipText:    { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  sortChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  sortChipActive: { backgroundColor: COLORS.primary },
  sortText:    { fontSize: 12, color: '#374151' },
  sortTextActive: { color: '#fff', fontWeight: '600' },
  count:       { fontSize: 12, color: '#6B7280', paddingHorizontal: 16, paddingBottom: 4 },
  item:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: .05, shadowRadius: 4, gap: 12 },
  itemImg:     { width: 110, height: 110, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge:       { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText:   { color: '#fff', fontSize: 9, fontWeight: '700' },
  name:        { fontSize: 14, fontWeight: '600', color: '#1A1A2E', marginTop: 12, marginRight: 8, lineHeight: 20 },
  category:    { fontSize: 11, color: '#9CA3AF', marginTop: 2, marginBottom: 4 },
  price:       { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  mrp:         { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  rating:      { fontSize: 11, color: '#6B7280', marginTop: 3 },
  empty:       { textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 15 },
});
