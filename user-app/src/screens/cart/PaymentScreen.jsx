import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { paymentAPI } from '../../services/api';
import { useDispatch } from 'react-redux';
import { resetCart } from '../../store/slices/cartSlice';
import { COLORS, formatCurrency } from '../../utils/helpers';

// NOTE: react-native-razorpay must be linked: npx react-native link react-native-razorpay
let RazorpayCheckout;
try { RazorpayCheckout = require('react-native-razorpay').default; } catch {}

export default function PaymentScreen({ navigation, route }) {
  const { orderId, orderNumber, amount } = route.params;
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const dispatch = useDispatch();

  useEffect(() => { initPayment(); }, []);

  const initPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await paymentAPI.createRazorpayOrder(orderId);
      const data = res.data.data;

      if (!RazorpayCheckout) {
        // Development fallback (no native module)
        Alert.alert('Payment Gateway', 'Razorpay is not available in this build. For production, link the native module.', [
          { text: 'Simulate Success', onPress: () => simulateSuccess(data) },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]);
        setLoading(false);
        return;
      }

      const options = {
        description:   `Order #${orderNumber}`,
        name:          'Shringar Jewelry',
        key:           data.keyId,
        order_id:      data.razorpayOrderId,
        amount:        data.amount,
        currency:      data.currency || 'INR',
        prefill:       data.prefill,
        theme:         { color: COLORS.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Verify on server
      const verifyRes = await paymentAPI.verify({
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature:  paymentData.razorpay_signature,
        orderId,
      });

      dispatch(resetCart());
      Alert.alert('Payment Successful! 🎉', `Order #${orderNumber} confirmed.\nPayment ID: ${paymentData.razorpay_payment_id}`);
      navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId } });
    } catch (err) {
      if (err?.code === 0) {
        setError('Payment cancelled by user');
      } else {
        setError(err.response?.data?.message || 'Payment failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const simulateSuccess = async (data) => {
    try {
      await paymentAPI.verify({
        razorpay_order_id:   data.razorpayOrderId,
        razorpay_payment_id: `pay_simulated_${Date.now()}`,
        razorpay_signature:  'simulated_signature',
        orderId,
      });
      dispatch(resetCart());
      navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId } });
    } catch (e) {
      Alert.alert('Error', 'Verification failed in simulation mode');
    }
  };

  return (
    <View style={s.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Opening payment gateway...</Text>
          <Text style={s.amount}>{formatCurrency(amount)}</Text>
        </>
      ) : error ? (
        <>
          <Text style={s.errorEmoji}>❌</Text>
          <Text style={s.errorTitle}>Payment Failed</Text>
          <Text style={s.errorMsg}>{error}</Text>
          <TouchableOpacity onPress={initPayment} style={s.retryBtn}>
            <Text style={s.retryText}>Retry Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.retryBtn, { backgroundColor: '#F3F4F6', marginTop: 10 }]}>
            <Text style={[s.retryText, { color: '#374151' }]}>Go Back</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#9CA3AF', fontSize: 15, marginTop: 20, textAlign: 'center' },
  amount:      { color: COLORS.primary, fontSize: 28, fontWeight: '700', marginTop: 12 },
  errorEmoji:  { fontSize: 56, marginBottom: 16 },
  errorTitle:  { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  errorMsg:    { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retryBtn:    { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, minWidth: 200, alignItems: 'center' },
  retryText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
