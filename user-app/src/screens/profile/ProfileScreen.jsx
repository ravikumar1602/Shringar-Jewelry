import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS } from '../../utils/helpers';

const MenuItem = ({ icon, label, sub, onPress, danger }) => (
  <TouchableOpacity onPress={onPress} style={s.menuItem}>
    <Text style={s.menuIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={[s.menuLabel, danger && { color: '#DC2626' }]}>{label}</Text>
      {sub && <Text style={s.menuSub}>{sub}</Text>}
    </View>
    <Text style={{ color: '#9CA3AF', fontSize: 16 }}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
    ]);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Avatar card */}
      <View style={s.profileCard}>
        <View style={s.avatarBox}>
          {user?.avatar?.url
            ? <Image source={{ uri: user.avatar.url }} style={s.avatar} />
            : <Text style={s.avatarLetter}>{user?.name?.charAt(0).toUpperCase()}</Text>}
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        {user?.phone && <Text style={s.phone}>📞 {user.phone}</Text>}
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={s.editBtn}>
          <Text style={s.editBtnText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>My Account</Text>
        <MenuItem icon="📦" label="My Orders"    sub="Track & manage orders"    onPress={() => navigation.navigate('Orders')} />
        <MenuItem icon="❤️" label="Wishlist"      sub="Saved items"              onPress={() => navigation.navigate('Wishlist')} />
        <MenuItem icon="📍" label="Addresses"    sub={`${user?.addresses?.length || 0} saved addresses`} onPress={() => navigation.navigate('Addresses')} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Settings</Text>
        <MenuItem icon="🔒" label="Change Password" sub="Update your password"  onPress={() => navigation.navigate('EditProfile', { changePassword: true })} />
      </View>

      <View style={s.section}>
        <MenuItem icon="🚪" label="Logout" danger onPress={handleLogout} />
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>✨ Shringar Jewelry v1.0.0</Text>
        <Text style={s.footerSub}>Handcrafted with love</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  profileCard:  { backgroundColor: '#1A1A2E', padding: 28, alignItems: 'center', paddingBottom: 32 },
  avatarBox:    { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(200,169,110,.4)' },
  avatar:       { width: 84, height: 84, borderRadius: 42 },
  avatarLetter: { fontSize: 34, fontWeight: '700', color: '#fff' },
  name:         { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email:        { fontSize: 13, color: '#9CA3AF', marginBottom: 2 },
  phone:        { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  editBtn:      { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary },
  editBtnText:  { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  section:      { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: .04, shadowRadius: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: .5 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 14 },
  menuIcon:     { fontSize: 22, width: 28, textAlign: 'center' },
  menuLabel:    { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  menuSub:      { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  footer:       { alignItems: 'center', padding: 28, marginTop: 8 },
  footerText:   { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  footerSub:    { fontSize: 11, color: '#C8A96E', marginTop: 4 },
});
