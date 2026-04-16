import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../utils/helpers';

// Screens
import HomeScreen       from '../screens/home/HomeScreen';
import SearchScreen     from '../screens/home/SearchScreen';
import ProductDetail    from '../screens/home/ProductDetailScreen';
import CartScreen       from '../screens/cart/CartScreen';
import CheckoutScreen   from '../screens/cart/CheckoutScreen';
import PaymentScreen    from '../screens/cart/PaymentScreen';
import OrdersScreen     from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';
import AddressesScreen  from '../screens/profile/AddressesScreen';
import WishlistScreen   from '../screens/profile/WishlistScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#1A1A2E' },
  headerTintColor: COLORS.primary,
  headerTitleStyle: { fontWeight: '700', color: '#fff' },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="HomeMain"     component={HomeScreen}    options={{ title: '✨ Shringar' }} />
      <Stack.Screen name="Search"       component={SearchScreen}  options={{ title: 'Search Products' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="CartMain"  component={CartScreen}    options={{ title: '🛒 My Cart' }} />
      <Stack.Screen name="Checkout"  component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="Payment"   component={PaymentScreen}  options={{ title: 'Payment' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="OrdersList"   component={OrdersScreen}      options={{ title: '📦 My Orders' }} />
      <Stack.Screen name="OrderDetail"  component={OrderDetailScreen}  options={{ title: 'Order Details' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ProfileMain"  component={ProfileScreen}     options={{ title: '👤 Profile' }} />
      <Stack.Screen name="EditProfile"  component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Addresses"    component={AddressesScreen}   options={{ title: 'My Addresses' }} />
      <Stack.Screen name="Wishlist"     component={WishlistScreen}    options={{ title: '❤️ Wishlist' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ emoji, label, focused, cartCount }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'relative' }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        {cartCount > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16,
            borderRadius: 8, backgroundColor: COLORS.primary,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{cartCount > 99 ? '99+' : cartCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MainNavigator() {
  const cartItems = useSelector((s) => s.cart.cart?.totalItems || 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A2E', borderTopWidth: 0,
          height: 64, paddingBottom: 8, paddingTop: 6,
          elevation: 20, shadowColor: '#000',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home"    component={HomeStack}    options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Cart"    component={CartStack}    options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} cartCount={cartItems} />, tabBarLabel: 'Cart' }} />
      <Tab.Screen name="Orders"  component={OrdersStack}  options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />, tabBarLabel: 'Orders' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
