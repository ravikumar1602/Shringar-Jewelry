import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await cartAPI.get();
    return res.data.data.cart;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const addToCart = createAsyncThunk('cart/add', async (payload, { rejectWithValue, dispatch }) => {
  try {
    const res = await cartAPI.add(payload);
    return res.data.data.cart;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to add to cart'); }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await cartAPI.update(itemId, quantity);
    return res.data.data.cart;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const res = await cartAPI.remove(itemId);
    return res.data.data.cart;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const applyCoupon = createAsyncThunk('cart/coupon', async (code, { rejectWithValue }) => {
  try {
    const res = await cartAPI.applyCoupon(code);
    return { cart: res.data.data.cart, message: res.data.message };
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const removeCoupon = createAsyncThunk('cart/removeCoupon', async (_, { rejectWithValue }) => {
  try {
    await cartAPI.removeCoupon();
    const res = await cartAPI.get();
    return res.data.data.cart;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const clearCart = createAsyncThunk('cart/clear', async () => {
  await cartAPI.clear();
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, loading: false, error: null, couponMessage: null },
  reducers: {
    clearCartError: (s) => { s.error = null; },
    clearCouponMessage: (s) => { s.couponMessage = null; },
    resetCart: (s) => { s.cart = null; },
  },
  extraReducers: (b) => {
    const setCart = (s, a) => { s.loading = false; s.cart = a.payload; };
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };

    b.addCase(fetchCart.pending, pending)
     .addCase(fetchCart.fulfilled, setCart)
     .addCase(fetchCart.rejected, rejected)

     .addCase(addToCart.pending, pending)
     .addCase(addToCart.fulfilled, setCart)
     .addCase(addToCart.rejected, rejected)

     .addCase(updateCartItem.fulfilled, setCart)
     .addCase(removeFromCart.fulfilled, setCart)

     .addCase(applyCoupon.fulfilled, (s, a) => {
       s.loading = false;
       s.cart = a.payload.cart;
       s.couponMessage = a.payload.message;
     })
     .addCase(applyCoupon.rejected, rejected)
     .addCase(removeCoupon.fulfilled, setCart)

     .addCase(clearCart.fulfilled, (s) => { s.cart = null; });
  },
});

export const { clearCartError, clearCouponMessage, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
