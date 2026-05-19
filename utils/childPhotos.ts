import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const PHOTOS_KEY = 'child_photos_v1';

const photoDir = () => new Directory(Paths.document, 'child_photos');

const ensureDir = () => {
  const dir = photoDir();
  if (!dir.exists) dir.create();
};

// ── Load map of { childName → localUri } ─────────────────────────────────────
export const loadChildPhotos = async (): Promise<Record<string, string>> => {
  const raw = await AsyncStorage.getItem(PHOTOS_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveMap = async (map: Record<string, string>) => {
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(map));
};

// ── Pick, compress, and copy to document directory ───────────────────────────
const pickAndSave = async (childName: string): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo access in your device settings.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;

  // Resize + compress to ~300×300 JPEG
  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 300, height: 300 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  ensureDir();

  const slug = childName.trim().toLowerCase().replace(/\s+/g, '_');
  const fileName = `${slug}_${Date.now()}.jpg`;
  const dest = new File(photoDir(), fileName);
  const src  = new File(manipulated.uri);
  src.copy(dest);

  return dest.uri;
};

// ── Delete a photo file ───────────────────────────────────────────────────────
const deletePhoto = (uri: string) => {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {}
};

// ── Main entry point: tap on a child's avatar ────────────────────────────────
export const handleChildPhotoTap = async (
  childName: string,
  currentUri: string | undefined,
  onUpdated: (map: Record<string, string>) => void
) => {
  const map = await loadChildPhotos();

  if (currentUri) {
    Alert.alert(
      `${childName}'s Photo`,
      'What would you like to do?',
      [
        {
          text: 'Replace photo',
          onPress: async () => {
            const newUri = await pickAndSave(childName);
            if (!newUri) return;
            deletePhoto(currentUri);
            const next = { ...map, [childName]: newUri };
            await saveMap(next);
            onUpdated(next);
          },
        },
        {
          text: 'Remove photo',
          style: 'destructive',
          onPress: async () => {
            deletePhoto(currentUri);
            const next = { ...map };
            delete next[childName];
            await saveMap(next);
            onUpdated(next);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  } else {
    const newUri = await pickAndSave(childName);
    if (!newUri) return;
    const next = { ...map, [childName]: newUri };
    await saveMap(next);
    onUpdated(next);
  }
};
