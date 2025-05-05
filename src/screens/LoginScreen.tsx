import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ToastAndroid,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';
import BiometricsManager from '../utils/BiometricsManager';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  
  // Check if biometrics is available
  useEffect(() => {
    const checkBiometrics = async () => {
      const { available, biometryType } = await BiometricsManager.isBiometricsAvailable();
      setBiometricsAvailable(available);
      setBiometryType(biometryType);
      
      // Check if user has stored biometric credentials
      if (available) {
        const hasCredentials = await BiometricsManager.hasStoredCredentials();
        setHasBiometricCredentials(hasCredentials);
        
        // Pre-fill email if stored
        if (hasCredentials) {
          const storedEmail = await BiometricsManager.getStoredEmail();
          if (storedEmail) {
            setEmail(storedEmail);
          }
        }
      }
    };
    
    checkBiometrics();
  }, []);
  
  // Handle biometric login
  const handleBiometricLogin = async () => {
    setError(null);
    setLocalLoading(true);
    setStatusMessage('Authenticating with biometrics...');
    
    try {
      const biometryName = BiometricsManager.getBiometryTypeName(biometryType);
      const result = await BiometricsManager.authenticate(`Sign in to Tedlist using ${biometryName}`);
      
      if (result.success && result.email) {
        // Simulate login with stored credentials
        setEmail(result.email);
        setStatusMessage('Biometric authentication successful!');
        
        // Use the stored credentials to log in
        await login(result.email, result.credentials || '');
      } else {
        setError('Biometric authentication failed. Please try again or use password.');
      }
    } catch (err) {
      console.error('Biometric login error:', err);
      setError('Biometric authentication failed. Please use your password.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setError(null);
    setLocalLoading(true);
    setStatusMessage('Logging in...');
    
    try {
      console.log('Attempting login with credentials');
      
      await login(email, password);
      setStatusMessage('Login successful!');
      
      // Ask if user wants to enable biometric login if available
      if (biometricsAvailable && !hasBiometricCredentials) {
        setTimeout(() => {
          const biometryName = BiometricsManager.getBiometryTypeName(biometryType);
          Alert.alert(
            `Enable ${biometryName} Login`,
            `Would you like to use ${biometryName} for quicker login next time?`,
            [
              {
                text: 'Not Now',
                style: 'cancel'
              },
              {
                text: 'Enable',
                onPress: async () => {
                  const success = await BiometricsManager.enableBiometrics(email, password);
                  if (success) {
                    if (Platform.OS === 'android') {
                      ToastAndroid.show(`${biometryName} login enabled`, ToastAndroid.SHORT);
                    } else {
                      Alert.alert('Success', `${biometryName} login enabled`);
                    }
                  }
                }
              }
            ]
          );
        }, 500); // Short delay for better UX
      }
      
      // The navigation is handled by the auth context through the AppNavigator
    } catch (err) {
      console.error('Login error:', err);
      
      if (err instanceof Error) {
        // More user-friendly error message
        if (err.message.includes('401')) {
          setError('Invalid email or password. Please try again.');
        } else if (err.message.includes('Network Error') || err.message.includes('timeout')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Login failed: ${err.message}`);
        }
      } else {
        setError('Login failed. Please try again.');
      }
      
      setStatusMessage(null);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.logoTed}>Ted</Text>
            <Text style={styles.logoL}>l</Text>
            <Text style={styles.logoIst}>ist</Text>
          </Text>
        </View>
        
        <Text style={styles.title}>Welcome Back</Text>
        
        {statusMessage && (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!localLoading}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              editable={!localLoading}
            />
          </View>
          
          <View style={styles.forgotContainer}>
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Password reset functionality will be available soon.')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.loginButton, (isLoading || localLoading) && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || localLoading}
          >
            {(isLoading || localLoading) ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>
          
          {/* Biometric Login Button */}
          {biometricsAvailable && hasBiometricCredentials && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={localLoading}
            >
              <Text style={styles.biometricButtonText}>
                {`Login with ${BiometricsManager.getBiometryTypeName(biometryType)}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.apiInfo}>Connected to: {API_BASE_URL}</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  logoTed: {
    color: '#b197fc',
  },
  logoL: {
    color: '#69db7c',
  },
  logoIst: {
    color: '#ffa8a8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusMessage: {
    textAlign: 'center',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    color: '#495057',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#7950f2',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#7950f2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#b29ddb',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#7950f2',
  },
  biometricButtonText: {
    color: '#7950f2',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginRight: 5,
  },
  linkText: {
    color: '#7950f2',
    fontSize: 14,
    fontWeight: '600',
  },
  apiInfo: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 10,
    marginBottom: 10,
  },
});

export default LoginScreen;
