import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { authAPI } from '../../services/api';
import { updateLocalUser } from '../../store/slices/authSlice';
import { COLORS } from '../../utils/helpers';

const EMPTY_ADDR = { label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false };

const Field = ({ label, req, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{label}{req && ' *'}</Text>
    <TextInput style={s.input} placeholderTextColor="#9CA3AF" {...props} />
  </View>
);

export default function AddressesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user }  = useSelector(st => st.auth);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY_ADDR);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setForm(EMPTY_ADDR); setModal('add'); };
  const openEdit = (addr) => { setForm({ ...addr }); setModal(addr._id); };

  const handleSave = async () => {
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode)
      return Alert.alert('Error', 'Please fill all required fields');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return Alert.alert('Error', 'Enter a valid 10-digit phone number');
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) return Alert.alert('Error', 'Enter a valid 6-digit pincode');

    setSaving(true);
    try {
      let res;
      if (modal === 'add') res = await authAPI.addAddress(form);
      else res = await authAPI.updateAddress(modal, form);
      dispatch(updateLocalUser({ addresses: res.data.data.addresses }));
      setModal(null);
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) =>
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await authAPI.deleteAddress(id);
          dispatch(updateLocalUser({ addresses: res.data.data.addresses }));
        } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Delete failed'); }
      }},
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }} showsVerticalScrollIndicator={false}>
        {user?.addresses?.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📍</Text>
            <Text style={s.emptyTitle}>No Addresses Saved</Text>
            <Text style={s.emptySub}>Add a delivery address to get started</Text>
          </View>
        )}
        {user?.addresses?.map(addr => (
          <View key={addr._id} style={s.addrCard}>
            <View style={s.addrHeader}>
              <View style={s.labelChip}><Text style={s.labelChipText}>{addr.label}</Text></View>
              {addr.isDefault && <View style={[s.labelChip, { backgroundColor: '#FEF3C7' }]}><Text style={[s.labelChipText, { color: '#92400E' }]}>Default</Text></View>}
            </View>
            <Text style={s.addrName}>{addr.fullName}</Text>
            <Text style={s.addrText}>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</Text>
            <Text style={s.addrText}>{addr.city}, {addr.state} - {addr.pincode}</Text>
            <Text style={s.addrPhone}>📞 {addr.phone}</Text>
            <View style={s.addrActions}>
              <TouchableOpacity onPress={() => openEdit(addr)} style={s.editAddrBtn}><Text style={s.editAddrText}>✏️ Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(addr._id)} style={s.deleteAddrBtn}><Text style={s.deleteAddrText}>🗑️ Delete</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        {(user?.addresses?.length || 0) < 5 && (
          <TouchableOpacity onPress={openAdd} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add New Address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal */}
      {modal !== null && (
        <KeyboardAvoidingView style={StyleSheet.absoluteFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.overlay} onPress={() => setModal(null)} activeOpacity={1} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{modal === 'add' ? '➕ Add Address' : '✏️ Edit Address'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={s.row}>
                {['Home','Work','Other'].map(lbl => (
                  <TouchableOpacity key={lbl} onPress={() => set('label', lbl)} style={[s.labelOption, form.label === lbl && s.labelOptionActive]}>
                    <Text style={[s.labelOptionText, form.label === lbl && { color: '#fff' }]}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="Full Name" req value={form.fullName} onChangeText={v => set('fullName', v)} placeholder="Recipient's full name" autoCapitalize="words" />
              <Field label="Phone Number" req value={form.phone} onChangeText={v => set('phone', v)} placeholder="10-digit mobile" keyboardType="phone-pad" />
              <Field label="Address Line 1" req value={form.addressLine1} onChangeText={v => set('addressLine1', v)} placeholder="House/Flat No., Street, Area" />
              <Field label="Address Line 2" value={form.addressLine2} onChangeText={v => set('addressLine2', v)} placeholder="Landmark (optional)" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="City" req value={form.city} onChangeText={v => set('city', v)} placeholder="City" autoCapitalize="words" /></View>
                <View style={{ flex: 1 }}><Field label="Pincode" req value={form.pincode} onChangeText={v => set('pincode', v)} placeholder="6-digit" keyboardType="number-pad" maxLength={6} /></View>
              </View>
              <Field label="State" req value={form.state} onChangeText={v => set('state', v)} placeholder="State" autoCapitalize="words" />
              <TouchableOpacity onPress={() => set('isDefault', !form.isDefault)} style={s.defaultRow}>
                <View style={[s.checkbox, form.isDefault && s.checkboxActive]}>
                  {form.isDefault && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={s.defaultText}>Set as default address</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.saveBtn, saving && { backgroundColor: '#9CA3AF' }]}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>💾 Save Address</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  empty:           { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  emptySub:        { fontSize: 14, color: '#6B7280' },
  addrCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: .04, shadowRadius: 4 },
  addrHeader:      { flexDirection: 'row', gap: 6, marginBottom: 8 },
  labelChip:       { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  labelChipText:   { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  addrName:        { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  addrText:        { fontSize: 13, color: '#374151', lineHeight: 20 },
  addrPhone:       { fontSize: 12, color: '#6B7280', marginTop: 4 },
  addrActions:     { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  editAddrBtn:     { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 8, alignItems: 'center' },
  editAddrText:    { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  deleteAddrBtn:   { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, alignItems: 'center' },
  deleteAddrText:  { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  addBtn:          { borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: 14, padding: 18, alignItems: 'center' },
  addBtnText:      { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,.5)' },
  sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 12, maxHeight: '90%' },
  sheetHandle:     { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  label:           { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input:           { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 11, fontSize: 14, color: '#1A1A2E' },
  row:             { flexDirection: 'row', gap: 8, marginBottom: 16 },
  labelOption:     { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  labelOptionActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelOptionText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  defaultRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  checkbox:        { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  defaultText:     { fontSize: 14, color: '#374151', fontWeight: '500' },
  saveBtn:         { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center' },
  saveBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
