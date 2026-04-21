import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { COLORS, validateEmail } from '../../utils/helpers';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const dispatch  = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  useEffect(() => { if (error) Alert.alert('Login Failed', error, [{ text: 'OK', onPress: () => dispatch(clearError()) }]); }, [error]);

  const handleLogin = () => {
    if (!validateEmail(email)) return Alert.alert('Invalid Email', 'Please enter a valid email address');
    if (password.length < 8)   return Alert.alert('Invalid Password', 'Password must be at least 8 characters');
    dispatch(loginUser({ email: email.toLowerCase().trim(), password }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoBox}>
          <Text style={s.logoEmoji}>✨</Text>
          <Text style={s.logoText}>Shringar Jewelry</Text>
          <Text style={s.logoSub}>Exquisite Craftsmanship</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          <Text style={s.label}>Email Address</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor="#9CA3AF"
            keyboardType="email-address" autoCapitalize="none"
            style={s.input}
          />

          <Text style={s.label}>Password</Text>
          <View style={s.pwdRow}>
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="Min 8 characters" placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPwd} style={[s.input, { flex: 1, marginBottom: 0 }]}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPwd ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: 8 }}>
            <Text style={s.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={[s.btn, loading && { backgroundColor: '#9CA3AF' }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.mutedText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { flexGrow: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', padding: 24 },
  logoBox:    { alignItems: 'center', marginBottom: 32 },
  logoEmoji:  { fontSize: 48 },
  logoText:   { fontSize: 26, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  logoSub:    { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card:       { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  title:      { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  label:      { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:      { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A2E', marginBottom: 16 },
  pwdRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 },
  eyeBtn:     { padding: 12 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  btn:        { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  row:        { flexDirection: 'row', justifyContent: 'center' },
  mutedText:  { fontSize: 14, color: '#6B7280' },
  linkText:   { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
