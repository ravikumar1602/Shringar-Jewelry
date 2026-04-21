import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { COLORS, validateEmail, validatePhone } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value) return '';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value) return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
      case 'phone':
        if (!value) return '';
        if (!/^[6-9]\d{9}$/.test(value)) return 'Invalid phone number';
        return '';
      case 'password':
        if (!value) return '';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Must have uppercase, lowercase and number';
        return '';
      case 'confirmPassword':
        if (!value) return '';
        if (value !== form.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: validateField(field, value) }));
  };

  useEffect(() => { if (error) Alert.alert('Registration Failed', error, [{ text: 'OK', onPress: () => dispatch(clearError()) }]); }, [error]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = () => {
    if (!form.name.trim() || form.name.length < 2) return Alert.alert('Error', 'Enter a valid name');
    if (!validateEmail(form.email))  return Alert.alert('Error', 'Enter a valid email');
    if (form.phone && !validatePhone(form.phone)) return Alert.alert('Error', 'Enter a valid 10-digit Indian phone number');
    if (form.password.length < 8)    return Alert.alert('Error', 'Password must be at least 8 characters');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) return Alert.alert('Error', 'Password must contain uppercase, lowercase and number');
    if (form.password !== form.confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    dispatch(registerUser({ name: form.name.trim(), email: form.email.toLowerCase().trim(), phone: form.phone, password: form.password }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logoBox}>
          <Ionicons name="diamond" size={40} color={COLORS.primary} />
          <Text style={s.logoText}>Create Account</Text>
          <Text style={s.logoSub}>Join the Shringar family</Text>
        </View>

        <View style={s.card}>
          {[
            { key: 'name',            label: 'Full Name *',       placeholder: 'Enter your name',          keyboard: 'default' },
            { key: 'email',           label: 'Email Address *',   placeholder: 'you@example.com',          keyboard: 'email-address' },
            { key: 'phone',           label: 'Phone Number',      placeholder: '10-digit mobile number',   keyboard: 'phone-pad' },
          ].map(({ key, label, placeholder, keyboard }) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <TextInput
                value={form[key]}
                onChangeText={v => handleFieldChange(key, v)}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboard}
                style={[s.input, errors[key] && { borderColor: '#DC2626' }]}
              />
              {errors[key] ? <Text style={s.errorText}>{errors[key]}</Text> : null}
            </View>
          ))}

          <Text style={s.label}>Password *</Text>
          <View style={s.pwdRow}>
            <TextInput value={form.password} onChangeText={v => handleFieldChange('password', v)} placeholder="Min 8 characters (A-z + 0-9)" placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPwd} style={[s.input, { flex: 1, marginBottom: 0 }, errors.password && { borderColor: '#DC2626' }]} />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 12 }}>
              <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16, marginTop: 4 }}>Must have uppercase, lowercase and number</Text>

          <Text style={s.label}>Confirm Password *</Text>
          <TextInput value={form.confirmPassword} onChangeText={v => handleFieldChange('confirmPassword', v)} placeholder="Re-enter password" placeholderTextColor="#9CA3AF"
            secureTextEntry style={[s.input, errors.confirmPassword && { borderColor: '#DC2626' }]} />
          {errors.confirmPassword ? <Text style={s.errorText}>{errors.confirmPassword}</Text> : null}

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={[s.btn, loading && { backgroundColor: '#9CA3AF' }]} activeOpacity={0.7}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.mutedText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { flexGrow: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', padding: 24 },
  logoBox:    { alignItems: 'center', marginBottom: 28 },
  logoText:   { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  logoSub:    { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card:       { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  label:      { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:      { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A2E', marginBottom: 4 },
  errorText:  { fontSize: 11, color: '#DC2626', marginBottom: 16 },
  pwdRow:     { flexDirection: 'row', alignItems: 'center' },
  btn:        { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  row:        { flexDirection: 'row', justifyContent: 'center' },
  mutedText:  { fontSize: 14, color: '#6B7280' },
  linkText:   { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
