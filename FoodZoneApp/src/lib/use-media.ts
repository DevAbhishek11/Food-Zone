import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

import { api } from './api';

/**
 * Pick an image from the library and upload it to POST /media.
 * Returns the stored absolute URL, or null if cancelled / failed.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async (category: string): Promise<string | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload images.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return null;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const fd = new FormData();
      const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg';
      const type = asset.mimeType ?? 'image/jpeg';
      // React Native's FormData accepts a { uri, name, type } file descriptor.
      fd.append('file', { uri: asset.uri, name, type } as unknown as Blob);
      fd.append('category', category);
      const res = await api.post<{ url: string }>('/media', fd);
      return res.data.url;
    } catch {
      Alert.alert('Upload failed', 'Please try again with a smaller image.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUpload, uploading };
}
