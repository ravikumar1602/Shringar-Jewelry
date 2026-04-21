import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { COLORS, validateEmail } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const dispatch  = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) return '';
    if (!emailRegex.test(text)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (text) => {
    if (!text) return '';
    if (text.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  useEffect(() => { if (error) Alert.alert('Login Failed', error, [{ text: 'OK', onPress: () => dispatch(clearError()) }]); }, [error]);

  const handleLogin = () => {
    const emailErr = validateEmail(email);
    const pwdErr = validatePassword(password);
    if (emailErr) return Alert.alert('Invalid Email', emailErr);
    if (pwdErr) return Alert.alert('Invalid Password', pwdErr);
    dispatch(loginUser({ email: email.toLowerCase().trim(), password }));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError(validateEmail(text));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError(validatePassword(text));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoBox}>
          <Ionicons name="diamond" size={48} color={COLORS.primary} />
          <Text style={s.logoText}>Shringar Jewelry</Text>
          <Text style={s.logoSub}>Exquisite Craftsmanship</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          <Text style={s.label}>Email Address</Text>
          <TextInput
            value={email} onChangeText={handleEmailChange}
            placeholder="you@example.com" placeholderTextColor="#9CA3AF"
            keyboardType="email-address" autoCapitalize="none" style={[s.input, emailError && { borderColor: '#DC2626' }]}
          />
          {emailError ? <Text style={s.errorText}>{emailError}</Text> : null}

          <Text style={s.label}>Password</Text>
          <View style={s.pwdRow}>
            <TextInput
              value={password} onChangeText={handlePasswordChange}
              placeholder="Min 8 characters" placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPwd} style={[s.input, { flex: 1, marginBottom: 0 }, passwordError && { borderColor: '#DC2626' }]}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={s.errorText}>{passwordError}</Text> : null}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: 8 }}>
            <Text style={s.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={[s.btn, loading && { backgroundColor: '#9CA3AF' }]} activeOpacity={0.7}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Sign In</Text>}
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
  logoText:   { fontSize: 26, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  logoSub:    { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card:       { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  title:      { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  label:      { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:      { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A2E', marginBottom: 4 },
  errorText:  { fontSize: 11, color: '#DC2626', marginBottom: 16 },
  pwdRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 },
  eyeBtn:     { padding: 12 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  btn:        { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  row:        { flexDirection: 'row', justifyContent: 'center' },
  mutedText:  { fontSize: 14, color: '#6B7280' },
  linkText:   { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
