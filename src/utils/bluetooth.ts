import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// TypeKids Bluetooth service UUID (custom)
const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const CHAR_PROMPT_UUID = '12345678-1234-1234-1234-123456789ab1';
const CHAR_PROGRESS_UUID = '12345678-1234-1234-1234-123456789ab2';
const CHAR_RESULT_UUID = '12345678-1234-1234-1234-123456789ab3';

export interface MultiplayerResult {
  nickname: string;
  accuracy: number;
  wpm: number;
  completedAt: number;
}

class BluetoothService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private onProgressUpdate: ((progress: number) => void) | null = null;
  private onGameResult: ((result: MultiplayerResult) => void) | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  async scanForDevices(
    onDeviceFound: (device: { id: string; name: string }) => void,
    timeoutMs: number = 10000
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) throw new Error('Bluetooth permissions denied');

    return new Promise((resolve) => {
      const seen = new Set<string>();

      this.manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) return;
          if (device && device.name && !seen.has(device.id)) {
            seen.add(device.id);
            onDeviceFound({ id: device.id, name: device.name });
          }
        }
      );

      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve();
      }, timeoutMs);
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      // Listen for opponent progress updates
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHAR_PROGRESS_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const progress = parseFloat(atob(characteristic.value));
          this.onProgressUpdate?.(progress);
        }
      );

      // Listen for opponent result
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHAR_RESULT_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          try {
            const result = JSON.parse(atob(characteristic.value));
            this.onGameResult?.(result);
          } catch {}
        }
      );

      return true;
    } catch {
      return false;
    }
  }

  async sendProgress(progress: number): Promise<void> {
    if (!this.connectedDevice) return;
    try {
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHAR_PROGRESS_UUID,
        btoa(String(progress))
      );
    } catch {}
  }

  async sendResult(result: MultiplayerResult): Promise<void> {
    if (!this.connectedDevice) return;
    try {
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHAR_RESULT_UUID,
        btoa(JSON.stringify(result))
      );
    } catch {}
  }

  setOnProgressUpdate(callback: (progress: number) => void): void {
    this.onProgressUpdate = callback;
  }

  setOnGameResult(callback: (result: MultiplayerResult) => void): void {
    this.onGameResult = callback;
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch {}
      this.connectedDevice = null;
    }
  }

  destroy(): void {
    this.disconnect();
    this.manager.destroy();
  }
}

// Singleton
export const bluetoothService = new BluetoothService();
