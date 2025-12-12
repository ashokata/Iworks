import { View, Text, Image, TouchableOpacity, ScrollView, Alert, useColorScheme, Modal } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Trash2, Plus } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export interface CapturedPhoto {
  id: string;
  uri: string;
  caption?: string;
  timestamp: Date;
  uploaded: boolean;
}

interface PhotoCaptureProps {
  photos: CapturedPhoto[];
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
  title?: string;
}

/**
 * Photo Capture Component
 * Allows taking photos with camera or selecting from gallery
 * Manages a list of photos with captions
 */
export function PhotoCapture({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 10,
  title = 'Photos'
}: PhotoCaptureProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [showModal, setShowModal] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in your device settings to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: CapturedPhoto = {
          id: `photo-${Date.now()}`,
          uri: result.assets[0].uri,
          timestamp: new Date(),
          uploaded: false,
        };
        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: maxPhotos - photos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos: CapturedPhoto[] = result.assets.map((asset, index) => ({
          id: `photo-${Date.now()}-${index}`,
          uri: asset.uri,
          timestamp: new Date(),
          uploaded: false,
        }));
        onPhotosChange([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onPhotosChange(photos.filter(p => p.id !== photoId));
            if (selectedPhoto?.id === photoId) {
              setSelectedPhoto(null);
              setShowModal(false);
            }
          }
        },
      ]
    );
  };

  const showPhotoOptions = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {photos.length}/{maxPhotos}
        </Text>
      </View>

      {/* Photo Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {/* Add Photo Button */}
        <TouchableOpacity
          onPress={showPhotoOptions}
          className={`w-24 h-24 rounded-xl mr-3 items-center justify-center border-2 border-dashed ${
            isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <Plus size={32} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
          <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Add
          </Text>
        </TouchableOpacity>

        {/* Photo Thumbnails */}
        {photos.map((photo) => (
          <TouchableOpacity
            key={photo.id}
            onPress={() => {
              setSelectedPhoto(photo);
              setShowModal(true);
            }}
            className="w-24 h-24 rounded-xl mr-3 overflow-hidden"
          >
            <Image 
              source={{ uri: photo.uri }} 
              className="w-full h-full"
              resizeMode="cover"
            />
            {!photo.uploaded && (
              <View className="absolute top-1 right-1 bg-warning-500 rounded-full w-3 h-3" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Action Buttons */}
      <View className="flex-row mt-3">
        <TouchableOpacity
          onPress={takePhoto}
          disabled={photos.length >= maxPhotos}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl mr-2 ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          } ${photos.length >= maxPhotos ? 'opacity-50' : ''}`}
        >
          <Camera size={18} color={Colors.primary[600]} />
          <Text className="text-primary-600 font-medium ml-2">Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={pickFromGallery}
          disabled={photos.length >= maxPhotos}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          } ${photos.length >= maxPhotos ? 'opacity-50' : ''}`}
        >
          <ImageIcon size={18} color={Colors.primary[600]} />
          <Text className="text-primary-600 font-medium ml-2">Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Photo Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 pt-12">
            <TouchableOpacity onPress={() => setShowModal(false)} className="p-2">
              <X size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => selectedPhoto && deletePhoto(selectedPhoto.id)} 
              className="p-2"
            >
              <Trash2 size={24} color={Colors.danger[500]} />
            </TouchableOpacity>
          </View>

          {/* Full Size Photo */}
          {selectedPhoto && (
            <View className="flex-1 justify-center items-center">
              <Image 
                source={{ uri: selectedPhoto.uri }} 
                className="w-full h-96"
                resizeMode="contain"
              />
              <Text className="text-white text-sm mt-4">
                {selectedPhoto.timestamp.toLocaleString()}
              </Text>
              {!selectedPhoto.uploaded && (
                <View className="flex-row items-center mt-2 bg-warning-500/20 px-3 py-1 rounded-full">
                  <View className="w-2 h-2 rounded-full bg-warning-500 mr-2" />
                  <Text className="text-warning-400 text-sm">Pending upload</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

