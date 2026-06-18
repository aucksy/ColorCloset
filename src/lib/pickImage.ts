/**
 * Launch the camera or gallery and return a local image URI (or null if the user
 * cancels or denies permission — callers fall back to the manual palette).
 */
import * as ImagePicker from 'expo-image-picker';

export type PickSource = 'camera' | 'gallery';

interface PickOpts {
  /** Open the front (selfie) camera — used for the skin-tone scan. */
  front?: boolean;
}

export async function pickImage(source: PickSource, { front }: PickOpts = {}): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { quality: 0.7, allowsEditing: false, exif: false };
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return null;
      const res = await ImagePicker.launchCameraAsync({
        ...opts,
        cameraType: front ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });
      if (res.canceled || !res.assets?.length) return null;
      return res.assets[0].uri;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.length) return null;
    return res.assets[0].uri;
  } catch {
    return null;
  }
}
