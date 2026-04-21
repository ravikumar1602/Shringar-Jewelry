import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { authAPI } from '../../services/api';
import { COLORS } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.toLowerCase().trim());
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Ionicons name={sent ? 'mail' : 'lock-closed'} size={52} color={COLORS.primary} />
        <Text style={s.title}>{sent ? 'Email Sent!' : 'Forgot Password?'}</Text>
        <Text style={s.subtitle}>
          {sent
            ? `We've sent a reset link to ${email}. Please check your inbox.`
            : 'Enter your registered email to receive a password reset link.'}
        </Text>

        {!sent && (
          <>
            <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor="#9CA3AF"
              keyboardType="email-address" autoCapitalize="none" style={s.input} />
            <TouchableOpacity onPress={handleSend} disabled={loading} style={[s.btn, loading && { backgroundColor: '#9CA3AF' }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </>
        )}

        {sent && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.btn}>
            <Text style={s.btnText}>Back to Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', padding: 28, justifyContent: 'center' },
  backBtn:   { position: 'absolute', top: 50, left: 24 },
  backText:  { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  title:     { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 12 },
  subtitle:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  input:     { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1A1A2E', marginBottom: 20 },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center' },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
