import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PhotoCapture, CapturedPhoto } from '../forms/PhotoCapture';
import { SignatureCapture } from '../forms/SignatureCapture';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required?: boolean;
}

interface JobCompletionFlowProps {
  jobId: string;
  jobTitle: string;
  customerName: string;
  onComplete: (data: any) => void;
}

export function JobCompletionFlow({
  jobId,
  jobTitle,
  customerName,
  onComplete
}: JobCompletionFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completionData, setCompletionData] = useState({
    photos: [] as CapturedPhoto[],
    checklist: [] as ChecklistItem[],
    notes: '',
    signature: '',
  });

  // Sample checklist items
  const defaultChecklist: ChecklistItem[] = [
    { id: '1', label: 'Inspected all equipment', checked: false, required: true },
    { id: '2', label: 'Replaced filters', checked: false },
    { id: '3', label: 'Tested system operation', checked: false, required: true },
    { id: '4', label: 'Cleaned work area', checked: false },
    { id: '5', label: 'Customer briefed on work done', checked: false, required: true },
  ];

  const steps = [
    { title: 'Photos', icon: 'camera', required: true },
    { title: 'Checklist', icon: 'checkbox', required: true },
    { title: 'Notes', icon: 'document-text', required: false },
    { title: 'Signature', icon: 'create', required: true },
  ];

  const handleStepComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      '✅ Job Completed!',
      'Great work! The job has been marked as complete.',
      [
        {
          text: 'Done',
          onPress: () => {
            onComplete(completionData);
            router.back();
          }
        }
      ]
    );
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0: // Photos
        return completionData.photos.length > 0;
      case 1: // Checklist
        return completionData.checklist.filter(item => item.required && item.checked).length ===
               defaultChecklist.filter(item => item.required).length;
      case 2: // Notes
        return true; // Optional
      case 3: // Signature
        return !!completionData.signature;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Photos
        return (
          <View>
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Take Photos
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Document the work completed
            </Text>
            <PhotoCapture
              photos={completionData.photos}
              onPhotosChange={(photos) =>
                setCompletionData({...completionData, photos})
              }
              maxPhotos={5}
              title="Job Photos"
            />
          </View>
        );

      case 1: // Checklist
        return (
          <View>
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Completion Checklist
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Confirm all required tasks
            </Text>
            {defaultChecklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                className={`flex-row items-center py-4 px-4 mb-2 rounded-xl ${
                  item.checked
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const newChecklist = [...defaultChecklist];
                  const index = newChecklist.findIndex(i => i.id === item.id);
                  newChecklist[index].checked = !newChecklist[index].checked;
                  setCompletionData({...completionData, checklist: newChecklist});
                }}
              >
                <View className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  item.checked
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {item.checked && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text className={`flex-1 ${
                  item.checked
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {item.label}
                  {item.required && <Text className="text-red-500"> *</Text>}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2: // Notes
        return (
          <View>
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Additional Notes
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Any important details or observations
            </Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-gray-900 dark:text-white min-h-32"
              multiline
              placeholder="Enter any additional notes..."
              placeholderTextColor="#9CA3AF"
              value={completionData.notes}
              onChangeText={(text) =>
                setCompletionData({...completionData, notes: text})
              }
            />
            {/* Voice Input Button */}
            <TouchableOpacity
              className="bg-primary-100 dark:bg-primary-900/20 py-4 rounded-xl items-center mt-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Voice Input', 'Voice input would be activated here');
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="mic" size={24} color="#2563eb" />
                <Text className="text-primary-600 font-semibold ml-2">
                  Use Voice Input
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );

      case 3: // Signature
        return (
          <View>
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Customer Signature
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Please have {customerName} sign below
            </Text>
            <SignatureCapture
              onSignature={(signature) =>
                setCompletionData({...completionData, signature})
              }
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white dark:bg-gray-800 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-base font-semibold text-gray-900 dark:text-white">
              Complete Job
            </Text>
            <View className="w-10" />
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
            {jobTitle}
          </Text>
        </View>

        {/* Progress Steps */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 flex-row justify-between">
          {steps.map((step, index) => (
            <TouchableOpacity
              key={index}
              className="items-center"
              onPress={() => {
                if (index < currentStep || (index === currentStep && isStepComplete(index))) {
                  setCurrentStep(index);
                }
              }}
              disabled={index > currentStep}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                index < currentStep || (index === currentStep && isStepComplete(index))
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-primary-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <Ionicons
                  name={step.icon as any}
                  size={20}
                  color="white"
                />
              </View>
              <Text className={`text-xs mt-1 ${
                index === currentStep
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step Content */}
        <ScrollView className="flex-1 px-4 py-4">
          <Card padding="lg">
            {renderStepContent()}
          </Card>
        </ScrollView>

        {/* Bottom Action */}
        <View className="p-4 bg-white dark:bg-gray-800">
          <Button
            onPress={handleStepComplete}
            disabled={!isStepComplete(currentStep)}
            fullWidth
            size="large"
          >
            {currentStep === steps.length - 1 ? 'Complete Job' : 'Next'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}