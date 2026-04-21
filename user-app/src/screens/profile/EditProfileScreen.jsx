import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import { COLORS } from '../../utils/helpers';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Field = ({ label, ...props }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={s.input} placeholderTextColor="#9CA3AF" {...props} />
  </View>
);

export default function EditProfileScreen({ navigation, route }) {
  const changePassword = route.params?.changePassword;
  const dispatch = useDispatch();
  const { user, loading } = useSelector(s => s.auth);

  const [name, setName]   = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pwds, setPwds]   = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab]     = useState(changePassword ? 'password' : 'profile');

  const handleSaveProfile = async () => {
    if (!name.trim() || name.length < 2) return Alert.alert('Error', 'Name must be at least 2 characters');
    const result = await dispatch(updateUserProfile({ name: name.trim(), phone }));
    if (updateUserProfile.fulfilled.match(result)) { Alert.alert('Success', 'Profile updated!'); navigation.goBack(); }
    else Alert.alert('Error', result.payload || 'Update failed');
  };

  const handleChangePassword = async () => {
    if (!pwds.current) return Alert.alert('Error', 'Enter current password');
    if (pwds.newPwd.length < 8) return Alert.alert('Error', 'New password must be at least 8 characters');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwds.newPwd)) return Alert.alert('Error', 'Password must contain uppercase, lowercase and number');
    if (pwds.newPwd !== pwds.confirm) return Alert.alert('Error', 'Passwords do not match');
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwds.current, password: pwds.newPwd });
      Alert.alert('Success', 'Password changed successfully!');
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        {/* Tabs */}
        <View style={s.tabs}>
          {[
            { key: 'profile', icon: 'person', label: 'Profile' },
            { key: 'password', icon: 'lock-closed', label: 'Password' }
          ].map(({ key, icon, label }) => (
            <TouchableOpacity key={key} onPress={() => setTab(key)} style={[s.tab, tab === key && s.tabActive]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={icon} size={16} color={tab === key ? COLORS.primary : '#6B7280'} />
                <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.form}>
          {tab === 'profile' ? (
            <>
              <Field label="Full Name *" value={name} onChangeText={setName} placeholder="Your full name" autoCapitalize="words" />
              <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="10-digit number" keyboardType="phone-pad" />
              <View style={s.disabledField}>
                <Text style={s.label}>Email (cannot be changed)</Text>
                <Text style={s.disabledText}>{user?.email}</Text>
              </View>
              <TouchableOpacity onPress={handleSaveProfile} disabled={loading} style={[s.btn, loading && { backgroundColor: '#9CA3AF' }]} activeOpacity={0.7}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Save Profile</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Field label="Current Password *" value={pwds.current} onChangeText={v => setPwds(p => ({ ...p, current: v }))} placeholder="Enter current password" secureTextEntry />
              <Field label="New Password *" value={pwds.newPwd} onChangeText={v => setPwds(p => ({ ...p, newPwd: v }))} placeholder="Min 8 chars (A-z + 0-9)" secureTextEntry />
              <Field label="Confirm New Password *" value={pwds.confirm} onChangeText={v => setPwds(p => ({ ...p, confirm: v }))} placeholder="Re-enter new password" secureTextEntry />
              <TouchableOpacity onPress={handleChangePassword} disabled={saving} style={[s.btn, saving && { backgroundColor: '#9CA3AF' }]} activeOpacity={0.7}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Change Password</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.bg },
  tabs:          { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 2 },
  tab:           { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:     { borderBottomColor: COLORS.primary },
  tabText:       { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  form:          { backgroundColor: '#fff', margin: 12, borderRadius: 14, padding: 20, elevation: 1, shadowColor: '#000', shadowOpacity: .04, shadowRadius: 4 },
  label:         { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:         { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A2E' },
  disabledField: { marginBottom: 16 },
  disabledText:  { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 10, fontSize: 14, color: '#9CA3AF' },
  btn:           { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText:       { color: '#fff', fontSize: 15, fontWeight: '700' },
});
