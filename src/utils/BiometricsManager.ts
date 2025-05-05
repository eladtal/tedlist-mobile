import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

// Initialize biometrics
const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

/**
 * Utility class for handling biometric authentication
 */
class BiometricsManager {
  /**
   * Check if biometric authentication is available on the device
   */
  static async isBiometricsAvailable(): Promise<{ available: boolean; biometryType: string | null }> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return { available, biometryType: biometryType || null };
    } catch (error) {
      console.error('Error checking biometrics availability:', error);
      return { available: false, biometryType: null };
    }
  }

  /**
   * Get the readable name of the biometry type
   */
  static getBiometryTypeName(biometryType: string | null): string {
    switch (biometryType) {
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.Biometrics:
        return Platform.OS === 'android' ? 'Fingerprint' : 'Biometrics';
      default:
        return 'Biometrics';
    }
  }

  /**
   * Check if biometric login is enabled for the current user
   */
  static async isBiometricsEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking if biometrics is enabled:', error);
      return false;
    }
  }

  /**
   * Enable biometric login for the current user
   * This should be called after a successful email/password login
   */
  static async enableBiometrics(email: string, credentials: string): Promise<boolean> {
    try {
      // Check if biometrics is available
      const { available } = await this.isBiometricsAvailable();
      if (!available) {
        return false;
      }

      // Store the email and credentials securely
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
      await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, credentials);
      
      return true;
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return false;
    }
  }

  /**
   * Disable biometric login for the current user
   */
  static async disableBiometrics(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        BIOMETRIC_ENABLED_KEY,
        BIOMETRIC_EMAIL_KEY,
        BIOMETRIC_CREDENTIALS_KEY
      ]);
      return true;
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      return false;
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<{
    success: boolean;
    email?: string;
    credentials?: string;
  }> {
    try {
      // Check if biometrics is enabled
      const isEnabled = await this.isBiometricsEnabled();
      if (!isEnabled) {
        return { success: false };
      }

      // Get the stored email and credentials
      const email = await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
      const credentials = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);

      if (!email || !credentials) {
        // No stored credentials
        await this.disableBiometrics(); // Clean up invalid state
        return { success: false };
      }

      // Prompt for biometric authentication
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
      });

      if (!success) {
        return { success: false };
      }

      // Return the stored credentials on success
      return { success: true, email, credentials };
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      return { success: false };
    }
  }

  /**
   * Check if the user has biometric credentials stored
   */
  static async hasStoredCredentials(): Promise<boolean> {
    try {
      const email = await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
      const credentials = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
      return !!email && !!credentials;
    } catch (error) {
      console.error('Error checking stored credentials:', error);
      return false;
    }
  }

  /**
   * Get the stored email for biometric login
   */
  static async getStoredEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
      console.error('Error getting stored email:', error);
      return null;
    }
  }
}

export default BiometricsManager;
