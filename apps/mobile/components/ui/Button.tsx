import { TouchableOpacity, Text, ActivityIndicator, View, TouchableOpacityProps } from 'react-native';
import { Colors } from '../../constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: 'bg-primary-600', text: 'text-white' },
  secondary: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-white' },
  outline: { bg: 'bg-transparent', text: 'text-primary-600', border: 'border border-primary-600' },
  ghost: { bg: 'bg-transparent', text: 'text-primary-600' },
  danger: { bg: 'bg-danger-500', text: 'text-white' },
};

const sizeStyles: Record<ButtonSize, { padding: string; text: string; height: string }> = {
  sm: { padding: 'px-3 py-2', text: 'text-sm', height: 'h-9' },
  md: { padding: 'px-4 py-3', text: 'text-base', height: 'h-12' },
  lg: { padding: 'px-6 py-4', text: 'text-lg', height: 'h-14' },
};

/**
 * Reusable Button component with multiple variants and sizes
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={`
        ${variantStyle.bg}
        ${variantStyle.border || ''}
        ${sizeStyle.padding}
        ${sizeStyle.height}
        rounded-xl
        flex-row items-center justify-center
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-60' : ''}
        ${className}
      `}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? 'white' : Colors.primary[600]} 
        />
      ) : (
        <View className="flex-row items-center">
          {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
          <Text className={`${variantStyle.text} ${sizeStyle.text} font-semibold`}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

