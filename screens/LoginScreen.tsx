import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { authService, type LoginCredentials } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validasi input
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(formData);

      // Login berhasil - gunakan auth context
      login(response.token, response.user);
      // Alert.alert('Success', response.message);
    } catch (error: any) {
      // Login gagal
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="flex-1 bg-white">
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Welcome Text */}
            <Text className="mb-4 text-lg">Welcome back to FlexiFin</Text>

            {/* Login Title */}
            <View style={styles.titleContainer}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#50c878' }}>Login</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text className="mb-2 font-bold">Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Eg. example@email.com"
                  placeholderTextColor="#C7C7CD"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text className="mb-2 font-bold">Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor="#C7C7CD"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry
                  />
                  <TouchableOpacity style={styles.eyeButton}>
                    <Text style={styles.eyeIcon}>👁</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerText}>Dont have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen' as never)}>
                <Text style={styles.registerLink}>Register here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 'auto',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  helpButton: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpText: {
    color: '#6366F1',
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 18,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  googleButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  registerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  registerLink: {
    fontSize: 14,
    color: '#50c878',
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    paddingBottom: 24,
  },
  termsLink: {
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
});
