import { View, Text, useColorScheme, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

interface OfflineBannerProps {
  isOffline: boolean;
  pendingChanges?: number;
}

/**
 * Banner that shows when the app is offline
 * Also shows the number of pending changes to sync
 */
export function OfflineBanner({ isOffline, pendingChanges = 0 }: OfflineBannerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline && pendingChanges === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={{ transform: [{ translateY: slideAnim }] }}
      className={`absolute top-0 left-0 right-0 z-50 ${
        isOffline ? 'bg-warning-500' : 'bg-primary-600'
      }`}
    >
      <View className="flex-row items-center justify-center py-2 px-4">
        {isOffline ? (
          <>
            <WifiOff size={16} color="white" />
            <Text className="text-white text-sm font-medium ml-2">
              You're offline - Changes will sync when connected
            </Text>
          </>
        ) : pendingChanges > 0 ? (
          <>
            <RefreshCw size={16} color="white" />
            <Text className="text-white text-sm font-medium ml-2">
              Syncing {pendingChanges} pending changes...
            </Text>
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}

