import { View, TextInput, Text, TextInputProps, useColorScheme, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'text' | 'password' | 'email' | 'phone' | 'number';
}

/**
 * Reusable Input component with label, error, and icon support
 */
export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  type = 'text',
  className = '',
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const keyboardType = 
    type === 'email' ? 'email-address' :
    type === 'phone' ? 'phone-pad' :
    type === 'number' ? 'numeric' :
    'default';

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </Text>
      )}
      
      <View 
        className={`
          flex-row items-center
          border rounded-xl px-4
          ${isDark ? 'bg-gray-800' : 'bg-gray-50'}
          ${isFocused 
            ? 'border-primary-500' 
            : error 
              ? 'border-danger-500' 
              : isDark ? 'border-gray-700' : 'border-gray-200'
          }
        `}
      >
        {leftIcon && (
          <View className="mr-3">
            {leftIcon}
          </View>
        )}
        
        <TextInput
          className={`flex-1 py-4 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
          placeholderTextColor={isDark ? Colors.gray[500] : Colors.gray[400]}
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoComplete={
            type === 'email' ? 'email' :
            type === 'password' ? 'password' :
            type === 'phone' ? 'tel' :
            'off'
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword 
              ? <EyeOff size={20} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
              : <Eye size={20} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
            }
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <View className="ml-3">
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text className="text-danger-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}

