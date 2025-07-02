import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { walletService, type CreateWalletData } from '../services/authService';

export default function AddWalletScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<CreateWalletData>({
    name: '',
    balance: 0,
    targetAmount: undefined,
    currentAmount: undefined,
    targetDate: undefined,
    status: 'normal',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleInputChange = (field: keyof CreateWalletData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberInput = (field: 'targetAmount' | 'currentAmount', value: string) => {
    const numericValue = Number(value);
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' || isNaN(numericValue) ? undefined : numericValue,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      setFormData((prev) => ({
        ...prev,
        targetDate: dateString,
      }));
    }
  };

  const handleSubmit = async () => {
    // Validasi input
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Wallet name is required');
      return;
    }

    if (formData.balance < 0) {
      Alert.alert('Error', 'Balance must be non-negative');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data untuk dikirim ke server
      const submitData: CreateWalletData = {
        name: formData.name.trim(),
        balance: Number(formData.balance),
        status: formData.status,
      };

      // Tambahkan optional fields jika ada nilai
      if (formData.targetAmount && formData.targetAmount > 0) {
        submitData.targetAmount = Number(formData.targetAmount);
      }
      if (formData.currentAmount && formData.currentAmount > 0) {
        submitData.currentAmount = Number(formData.currentAmount);
      }
      if (formData.targetDate && formData.targetDate.trim()) {
        submitData.targetDate = formData.targetDate.trim();
      }

      const response = await walletService.createWallet(submitData);

      Alert.alert('Success', response.message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.modernBackgroundStyle}>
        {/* Header Section */}
        <View style={styles.headerContainerStyle}>
          <View style={styles.headerRowStyle}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonStyle}>
              <Text style={styles.backButtonTextStyle}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerTitleContainerStyle}>
            <Text style={styles.headerTitleStyle}>Add New Wallet</Text>
            <Text style={styles.headerSubtitleStyle}>Create and manage your wallet</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentStyle}>
          {/* Main Form Card */}
          <View style={styles.mainCardStyle}>
            {/* Wallet Name - Required */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Wallet Name *</Text>
              <View style={styles.inputContainerStyle}>
                <TextInput
                  style={styles.textInputStyle}
                  placeholder="Enter wallet name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                />
              </View>
            </View>

            {/* Balance - Required */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Initial Balance *</Text>
              <View style={styles.inputContainerStyle}>
                <TextInput
                  style={styles.textInputStyle}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={formData.balance.toString()}
                  onChangeText={(value) => handleInputChange('balance', Number(value) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Status - Required with Dropdown */}
            {/* <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Status *</Text>
              <View style={styles.inputContainerStyle}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  style={styles.pickerStyle}>
                  <Picker.Item label="Normal" value="normal" />
                  <Picker.Item label="In Progress" value="in Progress" />
                  <Picker.Item label="Completed" value="completed" />
                </Picker>
              </View>
            </View> */}

            {/* Target Amount - Optional */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Target Amount (Optional)</Text>
              <Text style={styles.helpTextStyle}>
                Set a savings goal for this wallet to track your progress
              </Text>
              <View style={styles.inputContainerStyle}>
                <TextInput
                  style={styles.textInputStyle}
                  placeholder="e.g., 5000000 (for Rp 5,000,000)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.targetAmount?.toString() || ''}
                  onChangeText={(value) => handleNumberInput('targetAmount', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Current Amount - Optional */}
            {/* <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Current Amount (Optional)</Text>
              <View style={styles.inputContainerStyle}>
                <TextInput
                  style={styles.textInputStyle}
                  placeholder="Enter current amount"
                  placeholderTextColor="#9CA3AF"
                  value={formData.currentAmount?.toString() || ''}
                  onChangeText={(value) => handleNumberInput('currentAmount', value)}
                  keyboardType="numeric"
                />
              </View>
            </View> */}

            {/* Target Date - Optional */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Target Date (Optional)</Text>
              <TouchableOpacity
                style={styles.inputContainerStyle}
                onPress={() => setShowDatePicker(true)}>
                <Text
                  style={[
                    styles.dateTextStyle,
                    !formData.targetDate && styles.placeholderTextStyle,
                  ]}>
                  {formData.targetDate
                    ? new Date(formData.targetDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select target date'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.targetDate ? new Date(formData.targetDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButtonStyle, isLoading && styles.submitButtonDisabledStyle]}
              onPress={handleSubmit}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonTextStyle}>Create Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Modern Financial App Style Objects
  modernBackgroundStyle: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  headerContainerStyle: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  headerRowStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  backButtonStyle: {
    padding: 8,
  },

  backButtonTextStyle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },

  headerTitleContainerStyle: {
    marginBottom: 24,
  },

  headerTitleStyle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.5,
  },

  headerSubtitleStyle: {
    fontSize: 16,
    color: '#6B7280',
    letterSpacing: -0.1,
  },

  scrollViewStyle: {
    flex: 1,
  },

  scrollContentStyle: {
    padding: 20,
    paddingBottom: 40,
  },

  mainCardStyle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  cardSectionStyle: {
    marginBottom: 20,
  },

  labelStyle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  inputContainerStyle: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  textInputStyle: {
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 50,
  },

  pickerStyle: {
    height: 50,
    color: '#111827',
  },

  dateTextStyle: {
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },

  placeholderTextStyle: {
    color: '#9CA3AF',
  },

  helpTextStyle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },

  submitButtonStyle: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  submitButtonDisabledStyle: {
    backgroundColor: '#9CA3AF',
  },

  submitButtonTextStyle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
