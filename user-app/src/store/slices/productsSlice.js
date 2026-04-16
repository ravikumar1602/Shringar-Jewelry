import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';

export const fetchFeaturedProducts = createAsyncThunk('products/featured', async (_, { rejectWithValue }) => {
  try {
    const res = await productsAPI.getFeatured();
    return res.data.data.products;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchProducts = createAsyncThunk('products/list', async (params, { rejectWithValue }) => {
  try {
    const res = await productsAPI.getAll(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchProductDetail = createAsyncThunk('products/detail', async (id, { rejectWithValue }) => {
  try {
    const res = await productsAPI.getOne(id);
    return res.data.data.product;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchCategories = createAsyncThunk('products/categories', async (_, { rejectWithValue }) => {
  try {
    const res = await productsAPI.getCategories();
    return res.data.data.categories;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    featured: [],
    list: [],
    pagination: null,
    detail: null,
    categories: [],
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    clearDetail: (s) => { s.detail = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchFeaturedProducts.pending, (s) => { s.loading = true; })
     .addCase(fetchFeaturedProducts.fulfilled, (s, a) => { s.loading = false; s.featured = a.payload; })
     .addCase(fetchFeaturedProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

     .addCase(fetchProducts.pending, (s) => { s.loading = true; })
     .addCase(fetchProducts.fulfilled, (s, a) => {
       s.loading = false;
       s.list = a.payload.data.products;
       s.pagination = a.payload.pagination;
     })
     .addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

     .addCase(fetchProductDetail.pending, (s) => { s.detailLoading = true; s.detail = null; })
     .addCase(fetchProductDetail.fulfilled, (s, a) => { s.detailLoading = false; s.detail = a.payload; })
     .addCase(fetchProductDetail.rejected, (s, a) => { s.detailLoading = false; s.error = a.payload; })

     .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; });
  },
});

export const { clearDetail } = productsSlice.actions;
export default productsSlice.reducer;
