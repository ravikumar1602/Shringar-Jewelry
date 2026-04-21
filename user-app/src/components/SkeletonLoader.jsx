import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

export function ProductSkeleton() {
  return (
    <View style={s.card}>
      <View style={s.imageBox}>
        <Skeleton width="100%" height="100%" />
      </View>
      <View style={{ padding: 10 }}>
        <Skeleton width="80%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
}

export function ListSkeleton() {
  return (
    <View style={s.item}>
      <View style={s.itemImg}>
        <Skeleton width="100%" height="100%" />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="30%" height={14} />
      </View>
    </View>
  );
}

export function OrderSkeleton() {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={12} borderRadius={12} />
      </View>
      <View style={s.cardBody}>
        <View style={s.orderImg}>
          <Skeleton width="100%" height="100%" />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={13} />
          <Skeleton width="30%" height={12} />
          <Skeleton width="40%" height={15} />
        </View>
      </View>
    </View>
  );
}

function Skeleton({ width, height, style }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  return (
    <Animated.View style={[{ width, height, backgroundColor, borderRadius: 4 }, style]} />
  );
}

const s = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  imageBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemImg: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  orderImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
});
