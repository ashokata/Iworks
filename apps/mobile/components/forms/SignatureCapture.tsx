import { View, Text, TouchableOpacity, Modal, useColorScheme, Image, Alert } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { PenTool, RotateCcw, Check, X } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

interface SignatureCaptureProps {
  signature: string | null;
  onSignatureChange: (signature: string | null) => void;
  signerName?: string;
  onSignerNameChange?: (name: string) => void;
  title?: string;
  required?: boolean;
}

/**
 * Signature Capture Component
 * Full-screen signature pad for capturing customer signatures
 */
export function SignatureCapture({
  signature,
  onSignatureChange,
  signerName,
  onSignerNameChange,
  title = 'Customer Signature',
  required = false,
}: SignatureCaptureProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const signatureRef = useRef<SignatureViewRef>(null);

  const handleClear = useCallback(() => {
    signatureRef.current?.clearSignature();
  }, []);

  const handleConfirm = useCallback(() => {
    signatureRef.current?.readSignature();
  }, []);

  const handleOK = useCallback((signatureData: string) => {
    // signatureData is a base64 encoded PNG
    onSignatureChange(signatureData);
    setShowModal(false);
  }, [onSignatureChange]);

  const handleEmpty = useCallback(() => {
    Alert.alert('No Signature', 'Please sign before confirming.');
  }, []);

  const handleClearSignature = () => {
    Alert.alert(
      'Clear Signature',
      'Are you sure you want to clear this signature?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => onSignatureChange(null)
        },
      ]
    );
  };

  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: ${isDark ? '#1f2937' : '#ffffff'};
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body {
      background-color: ${isDark ? '#1f2937' : '#ffffff'};
    }
  `;

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </Text>
          {required && <Text className="text-danger-500 ml-1">*</Text>}
        </View>
        {signature && (
          <TouchableOpacity onPress={handleClearSignature}>
            <Text className="text-danger-500 text-sm font-medium">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Signature Display / Capture Button */}
      {signature ? (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className={`h-32 rounded-xl overflow-hidden border ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}
        >
          <Image 
            source={{ uri: signature }} 
            className="w-full h-full"
            resizeMode="contain"
          />
          <View className="absolute bottom-2 right-2 bg-primary-600 px-2 py-1 rounded">
            <Text className="text-white text-xs font-medium">Tap to redo</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className={`h-32 rounded-xl items-center justify-center border-2 border-dashed ${
            isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <PenTool size={32} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
          <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Tap to sign
          </Text>
        </TouchableOpacity>
      )}

      {/* Signer Name Display */}
      {signerName && (
        <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Signed by: {signerName}
        </Text>
      )}

      {/* Full Screen Signature Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Header */}
          <View className={`flex-row justify-between items-center px-4 pt-12 pb-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              className="flex-row items-center"
            >
              <X size={24} color={isDark ? Colors.gray[400] : Colors.gray[600]} />
              <Text className={`ml-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sign Here
            </Text>
            
            <TouchableOpacity 
              onPress={handleConfirm}
              className="flex-row items-center"
            >
              <Check size={24} color={Colors.primary[600]} />
              <Text className="ml-2 text-base text-primary-600 font-medium">
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Signature Pad */}
          <View className="flex-1 p-4">
            <View className={`flex-1 rounded-xl overflow-hidden border-2 ${
              isDark ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleOK}
                onEmpty={handleEmpty}
                webStyle={webStyle}
                backgroundColor={isDark ? '#1f2937' : '#ffffff'}
                penColor={isDark ? '#ffffff' : '#000000'}
                dotSize={2}
                minWidth={1.5}
                maxWidth={3}
              />
            </View>

            {/* Instructions */}
            <Text className={`text-center text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Use your finger or stylus to sign above
            </Text>
          </View>

          {/* Clear Button */}
          <View className={`px-4 pb-8 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <TouchableOpacity
              onPress={handleClear}
              className={`flex-row items-center justify-center py-3 rounded-xl ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <RotateCcw size={18} color={isDark ? Colors.gray[400] : Colors.gray[600]} />
              <Text className={`ml-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Clear & Start Over
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

