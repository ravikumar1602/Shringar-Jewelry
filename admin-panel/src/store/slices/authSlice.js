import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const loginAdmin = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(credentials);
    const { accessToken, user } = res.data.data;
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(user));
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
    isAuthenticated: !!localStorage.getItem('adminToken'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      toast.success('Logged out');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        toast.success('Welcome back!');
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
