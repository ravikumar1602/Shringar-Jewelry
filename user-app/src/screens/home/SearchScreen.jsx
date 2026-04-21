import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice';
import { COLORS, formatCurrency } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ListSkeleton } from '../../components/SkeletonLoader';

const SORT_OPTIONS = [
  { label: 'Newest', value: '-createdAt', icon: 'time' },
  { label: 'Price: Low to High', value: 'price', icon: 'trending-up' },
  { label: 'Price: High to Low', value: '-price', icon: 'trending-down' },
  { label: 'Top Rated', value: '-ratingsAverage', icon: 'star' },
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => { if (!categories.length) dispatch(fetchCategories()); }, []);

  const load = useCallback(() => {
    const params = { page, limit: 20, sort };
    if (search) params.search = search;
    if (category) params.category = category;
    dispatch(fetchProducts(params));
  }, [page, sort, search, category, dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setRefreshing(true); setPage(1); load(); setRefreshing(false); };

  const handleRetry = () => { setPage(1); load(); };

  const getSortLabel = () => SORT_OPTIONS.find(o => o.value === sort)?.label || 'Sort';

  return (
    <View style={s.container}>
      {/* Search input */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
        <TextInput value={search} onChangeText={v => { setSearch(v); setPage(1); }} placeholder="Search jewelry..."
          placeholderTextColor="#9CA3AF" style={s.searchInput} returnKeyType="search" />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#9CA3AF" /></TouchableOpacity>}
      </View>

      {/* Filter bar */}
      <View style={s.filterBar}>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={s.filterBtn}>
          <Ionicons name="filter" size={16} color={COLORS.primary} />
          <Text style={s.filterBtnText}>Filters</Text>
          {(category || sort !== '-createdAt') && <View style={s.filterDot} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setSort('-createdAt'); setCategory(''); setPage(1); }} style={s.clearBtn}>
          <Text style={s.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Active filters */}
      {(category || sort !== '-createdAt') && (
        <View style={s.activeFilters}>
          {category && (
            <View style={s.activeChip}>
              <Text style={s.activeChipText}>Category: {categories.find(c => c._id === category)?.name}</Text>
              <TouchableOpacity onPress={() => setCategory('')}><Ionicons name="close" size={14} color={COLORS.primary} /></TouchableOpacity>
            </View>
          )}
          {sort !== '-createdAt' && (
            <View style={s.activeChip}>
              <Text style={s.activeChipText}>Sort: {getSortLabel()}</Text>
              <TouchableOpacity onPress={() => setSort('-createdAt')}><Ionicons name="close" size={14} color={COLORS.primary} /></TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Count */}
      {pagination && <Text style={s.count}>{pagination.total} products found</Text>}

      {/* List */}
      {loading && page === 1
        ? <View style={{ padding: 12, gap: 12 }}>
            <ListSkeleton />
            <ListSkeleton />
            <ListSkeleton />
          </View>
        : <FlatList data={list} keyExtractor={i => i._id} contentContainerStyle={{ padding: 12, gap: 12 }}
            renderItem={({ item }) => (
              <ProductItem product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })} />
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <View style={s.emptyIconBox}>
                  <Ionicons name="search-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={s.empty}>No products found</Text>
                <Text style={s.emptySub}>Try adjusting your search or filters</Text>
                <TouchableOpacity onPress={handleRetry} style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 }} activeOpacity={0.7}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Retry</Text>
                </TouchableOpacity>
              </View>
            }
            onEndReached={() => { if (pagination && page < pagination.pages) setPage(p => p + 1); }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loading && page > 1 ? <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} /> : null}
            refreshing={refreshing} onRefresh={handleRefresh}
          />
      }

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} onPress={() => setFilterModalVisible(false)} activeOpacity={1}>
          <View style={s.modalContent}>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={s.modalClose}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            
            <Text style={s.modalTitle}>Filter Products</Text>
            
            {/* Category Section */}
            <View style={s.filterSection}>
              <Text style={s.filterSectionTitle}>Category</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 120 }}>
                <TouchableOpacity onPress={() => { setCategory(''); }} style={[s.filterOption, category === '' && s.filterOptionActive]}>
                  <View style={[s.filterRadio, category === '' && s.filterRadioActive]} />
                  <Text style={[s.filterOptionText, category === '' && s.filterOptionTextActive]}>All Categories</Text>
                </TouchableOpacity>
                {categories.slice(0, 10).map(cat => (
                  <TouchableOpacity key={cat._id} onPress={() => { setCategory(cat._id); }} style={[s.filterOption, category === cat._id && s.filterOptionActive]}>
                    <View style={[s.filterRadio, category === cat._id && s.filterRadioActive]} />
                    <Text style={[s.filterOptionText, category === cat._id && s.filterOptionTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sort Section */}
            <View style={s.filterSection}>
              <Text style={s.filterSectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} onPress={() => { setSort(opt.value); }} style={[s.filterOption, sort === opt.value && s.filterOptionActive]}>
                  <Ionicons name={opt.icon} size={18} color={sort === opt.value ? COLORS.primary : '#6B7280'} style={{ width: 24 }} />
                  <Text style={[s.filterOptionText, sort === opt.value && s.filterOptionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => { setFilterModalVisible(false); setPage(1); load(); }} style={s.applyBtn}>
              <Text style={s.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(200,169,110,0.1)', justifyContent: 'center', alignItems: 'center' },
  empty:       { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginTop: 12 },
  emptySub:    { fontSize: 13, color: '#6B7280', marginTop: 6 },
  // New filter UI styles
  filterBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(200,169,110,0.1)', borderRadius: 8 },
  filterBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  filterDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  clearBtn:    { paddingHorizontal: 12, paddingVertical: 8 },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  activeChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(200,169,110,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  activeChipText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, maxHeight: '80%' },
  modalClose:   { alignSelf: 'flex-end', padding: 4 },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },
  filterSection: { marginBottom: 20 },
  filterSectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  filterOptionActive: { backgroundColor: 'rgba(200,169,110,0.08)', borderRadius: 8 },
  filterRadio:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12 },
  filterRadioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterOptionText: { fontSize: 14, color: '#374151', flex: 1 },
  filterOptionTextActive: { color: COLORS.primary, fontWeight: '600' },
  applyBtn:     { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
