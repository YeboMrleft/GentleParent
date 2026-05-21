import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function isHuaweiDevice(): boolean {
  if (Platform.OS !== 'android') return false;
  const c   = Platform.constants as any;
  const brand = (c?.Brand ?? c?.brand ?? '').toUpperCase();
  const mfr   = (c?.Manufacturer ?? c?.manufacturer ?? '').toUpperCase();
  return brand.includes('HUAWEI') || brand.includes('HONOR') ||
         mfr.includes('HUAWEI')   || mfr.includes('HONOR');
}

const INSTALL_ID_KEY = 'gp_install_id_v1';

export async function getInstallId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
  if (existing) return existing;
  const id = `gp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALL_ID_KEY, id);
  return id;
}
