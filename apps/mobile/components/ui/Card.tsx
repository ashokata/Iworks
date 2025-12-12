import { View, ViewProps, useColorScheme } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Reusable Card component with consistent styling
 */
export function Card({ 
  children, 
  padding = 'md',
  shadow = true,
  className = '',
  style,
  ...props 
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`
        ${isDark ? 'bg-gray-800' : 'bg-white'}
        rounded-xl
        ${paddingStyles[padding]}
        ${className}
      `}
      style={[
        shadow && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

