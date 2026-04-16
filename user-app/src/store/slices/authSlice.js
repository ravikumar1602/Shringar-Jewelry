import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(credentials);
    const { accessToken, refreshToken, user } = res.data.data;
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    const { accessToken, refreshToken, user } = res.data.data;
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loadUserFromStorage = createAsyncThunk('auth/loadUser', async () => {
  const userData = await AsyncStorage.getItem('user');
  const token = await AsyncStorage.getItem('accessToken');
  if (userData && token) return JSON.parse(userData);
  return null;
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
});

export const updateUserProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.updateProfile(data);
    const user = res.data.data.user;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    bootstrapped: false,
    error: null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
    updateLocalUser: (s, a) => { s.user = { ...s.user, ...a.payload }; },
  },
  extraReducers: (b) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };

    b.addCase(loginUser.pending, pending)
     .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true; s.user = a.payload; })
     .addCase(loginUser.rejected, rejected)

     .addCase(registerUser.pending, pending)
     .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true; s.user = a.payload; })
     .addCase(registerUser.rejected, rejected)

     .addCase(loadUserFromStorage.fulfilled, (s, a) => {
       s.bootstrapped = true;
       if (a.payload) { s.user = a.payload; s.isAuthenticated = true; }
     })
     .addCase(loadUserFromStorage.rejected, (s) => { s.bootstrapped = true; })

     .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; })

     .addCase(updateUserProfile.pending, pending)
     .addCase(updateUserProfile.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
     .addCase(updateUserProfile.rejected, rejected);
  },
});

export const { clearError, updateLocalUser } = authSlice.actions;
export default authSlice.reducer;
