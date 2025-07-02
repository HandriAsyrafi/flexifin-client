import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { walletService, type Wallet, type CreateWalletData } from '../services/authService';

interface RouteParams {
  walletId: string;
}

export default function WalletDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { walletId } = route.params as RouteParams;

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState<CreateWalletData>({
    name: '',
    balance: 0,
    targetAmount: undefined,
    currentAmount: undefined,
    targetDate: undefined,
    status: 'normal',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadWalletDetail = async () => {
      setIsLoading(true);
      try {
        const response = await walletService.getWalletById(walletId);
        const walletData = response.data;
        setWallet(walletData);

        // Set form data
        setFormData({
          name: walletData.name,
          balance: walletData.balance,
          targetAmount: walletData.targetAmount || undefined,
          currentAmount: walletData.currentAmount || undefined,
          targetDate: walletData.targetDate || undefined,
          status: walletData.status,
        });
      } catch (error: any) {
        console.error('Error loading wallet detail:', error);
        Alert.alert('Error', error.message || 'Failed to load wallet details');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletDetail();
  }, [walletId, navigation]);

  const reloadWalletDetail = async () => {
    setIsLoading(true);
    try {
      const response = await walletService.getWalletById(walletId);
      const walletData = response.data;
      setWallet(walletData);

      // Set form data
      setFormData({
        name: walletData.name,
        balance: walletData.balance,
        targetAmount: walletData.targetAmount || undefined,
        currentAmount: walletData.currentAmount || undefined,
        targetDate: walletData.targetDate || undefined,
        status: walletData.status,
      });
    } catch (error: any) {
      console.error('Error loading wallet detail:', error);
      Alert.alert('Error', error.message || 'Failed to load wallet details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateWalletData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberInput = (
    field: 'balance' | 'targetAmount' | 'currentAmount',
    value: string
  ) => {
    const numericValue = Number(value);
    setFormData((prev) => ({
      ...prev,
      [field]:
        value === '' || isNaN(numericValue) ? (field === 'balance' ? 0 : undefined) : numericValue,
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

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Wallet name is required');
      return;
    }

    setIsLoading(true);
    try {
      await walletService.updateWallet(walletId, formData);
      Alert.alert('Success', 'Wallet updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditing(false);
            reloadWalletDetail(); // Reload data
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      Alert.alert('Error', error.message || 'Failed to update wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      await walletService.deleteWallet(walletId);
      Alert.alert('Success', 'Wallet deleted successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      Alert.alert('Error', error.message || 'Failed to delete wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = () => {
    if (!wallet?.targetAmount || wallet.targetAmount <= 0) return 0;
    const percentage = (wallet.balance / wallet.targetAmount) * 100;
    return Math.min(percentage, 100);
  };

  const getProgressColor = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return '#10B981'; // green
    if (progress >= 75) return '#3B82F6'; // blue
    if (progress >= 50) return '#8B5CF6'; // purple
    if (progress >= 25) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  if (isLoading && !wallet) {
    return (
      <View style={loadingContainerStyle}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={loadingTextStyle}>Loading wallet details...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={modernBackgroundStyle}>
        {/* Header Section */}
        <View style={headerContainerStyle}>
          <View style={headerRowStyle}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={backButtonStyle}>
              <Text style={backButtonTextStyle}>← Back</Text>
            </TouchableOpacity>
            {!isEditing && (
              <TouchableOpacity style={editButtonStyle} onPress={() => setIsEditing(true)}>
                <Text style={editButtonTextStyle}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={headerTitleContainerStyle}>
            <Text style={headerTitleStyle}>Wallet Details</Text>
            <Text style={headerSubtitleStyle}>Manage your wallet settings</Text>
          </View>
        </View>

        <ScrollView
          style={scrollViewStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}>
          {/* Progress Summary Card (if target exists) */}
          {wallet?.targetAmount && wallet.targetAmount > 0 && (
            <View style={progressCardStyle}>
              <Text style={progressTitleStyle}>Savings Progress</Text>

              <View style={progressHeaderStyle}>
                <Text style={progressLabelStyle}>Current</Text>
                <Text style={progressLabelStyle}>Target</Text>
              </View>

              <View style={progressAmountRowStyle}>
                <Text style={progressCurrentAmountStyle}>{formatAmount(wallet.balance)}</Text>
                <Text style={progressTargetAmountStyle}>{formatAmount(wallet.targetAmount)}</Text>
              </View>

              <View style={progressBarContainerStyle}>
                <View
                  style={[
                    progressBarFillStyle,
                    {
                      backgroundColor: getProgressColor(),
                      width: `${Math.max(getProgressPercentage(), 3)}%`,
                    },
                  ]}
                />
              </View>

              <View style={progressFooterStyle}>
                <Text style={[progressPercentageStyle, { color: getProgressColor() }]}>
                  {getProgressPercentage().toFixed(1)}% completed
                </Text>
                {getProgressPercentage() >= 100 ? (
                  <Text style={progressAchievedStyle}>🎉 Goal Achieved!</Text>
                ) : (
                  <Text style={progressRemainingStyle}>
                    {formatAmount(wallet.targetAmount - wallet.balance)} to go
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Main Form Card */}
          <View style={mainCardStyle}>
            {/* Wallet Name */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Wallet Name</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <TextInput
                  style={textInputStyle}
                  placeholder="Enter wallet name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Balance */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Balance</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <TextInput
                  style={textInputStyle}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={formData.balance.toString()}
                  onChangeText={(value) => handleNumberInput('balance', value)}
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Status */}
            {/* <View style={cardSectionStyle}>
              <Text style={labelStyle}>Status</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  enabled={isEditing}
                  style={pickerStyle}>
                  <Picker.Item label="Normal" value="normal" />
                  <Picker.Item label="In Progress" value="in Progress" />
                  <Picker.Item label="Completed" value="completed" />
                </Picker>
              </View>
            </View> */}

            {/* Target Amount */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Target Amount (Optional)</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <TextInput
                  style={textInputStyle}
                  placeholder="Enter target amount"
                  placeholderTextColor="#9CA3AF"
                  value={formData.targetAmount?.toString() || ''}
                  onChangeText={(value) => handleNumberInput('targetAmount', value)}
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Current Amount */}
            {/* <View style={cardSectionStyle}>
              <Text style={labelStyle}>Current Amount (Optional)</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <TextInput
                  style={textInputStyle}
                  placeholder="Enter current amount"
                  placeholderTextColor="#9CA3AF"
                  value={formData.currentAmount?.toString() || ''}
                  onChangeText={(value) => handleNumberInput('currentAmount', value)}
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            </View> */}

            {/* Target Date */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Target Date (Optional)</Text>
              <TouchableOpacity
                style={[inputContainerStyle, !isEditing && disabledInputStyle]}
                onPress={() => isEditing && setShowDatePicker(true)}>
                <Text style={dateTextStyle}>
                  {formData.targetDate
                    ? new Date(formData.targetDate).toLocaleDateString('id-ID')
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

            {/* Action Buttons */}
            {isEditing ? (
              <View style={actionButtonsRowStyle}>
                <TouchableOpacity
                  style={cancelButtonStyle}
                  onPress={() => {
                    setIsEditing(false);
                    // Reset form data
                    if (wallet) {
                      setFormData({
                        name: wallet.name,
                        balance: wallet.balance,
                        targetAmount: wallet.targetAmount || undefined,
                        currentAmount: wallet.currentAmount || undefined,
                        targetDate: wallet.targetDate || undefined,
                        status: wallet.status,
                      });
                    }
                  }}>
                  <Text style={cancelButtonTextStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={saveButtonStyle}
                  onPress={handleUpdate}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={saveButtonTextStyle}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={deleteButtonStyle}
                onPress={handleDelete}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={deleteButtonTextStyle}>Delete Wallet</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// Modern Style Objects
const loadingContainerStyle = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  backgroundColor: '#F9FAFB',
  padding: 20,
};

const loadingTextStyle = {
  marginTop: 16,
  fontSize: 16,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const modernBackgroundStyle = {
  flex: 1,
  backgroundColor: '#F9FAFB',
};

const headerContainerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 60,
  paddingHorizontal: 20,
  paddingBottom: 10,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const headerRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  marginBottom: 16,
};

const backButtonStyle = {
  padding: 8,
};

const backButtonTextStyle = {
  fontSize: 16,
  fontWeight: '500' as const,
  color: '#6B7280',
};

const editButtonStyle = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
};

const editButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600' as const,
};

const headerTitleContainerStyle = {
  marginBottom: 24,
};

const headerTitleStyle = {
  fontSize: 32,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 8,
  letterSpacing: -0.5,
};

const headerSubtitleStyle = {
  fontSize: 16,
  color: '#6B7280',
  letterSpacing: -0.1,
};

const scrollViewStyle = {
  flex: 1,
};

const scrollContentStyle = {
  padding: 20,
  paddingBottom: 40,
};

const progressCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
};

const progressTitleStyle = {
  fontSize: 18,
  fontWeight: '600' as const,
  color: '#111827',
  marginBottom: 16,
};

const progressHeaderStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  marginBottom: 8,
};

const progressLabelStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const progressAmountRowStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 16,
};

const progressCurrentAmountStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#059669',
};

const progressTargetAmountStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#111827',
};

const progressBarContainerStyle = {
  height: 8,
  backgroundColor: '#E5E7EB',
  borderRadius: 4,
  marginBottom: 12,
  overflow: 'hidden' as const,
};

const progressBarFillStyle = {
  height: 8,
  borderRadius: 4,
};

const progressFooterStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

const progressPercentageStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
};

const progressAchievedStyle = {
  fontSize: 14,
  color: '#059669',
  fontWeight: '600' as const,
};

const progressRemainingStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const mainCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
};

const cardSectionStyle = {
  marginBottom: 20,
};

const labelStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#374151',
  marginBottom: 8,
};

const inputContainerStyle = {
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 12,
  backgroundColor: '#FFFFFF',
};

const disabledInputStyle = {
  backgroundColor: '#F9FAFB',
  borderColor: '#E5E7EB',
};

const textInputStyle = {
  padding: 16,
  fontSize: 16,
  color: '#111827',
  minHeight: 50,
};

const pickerStyle = {
  height: 50,
  color: '#111827',
};

const dateTextStyle = {
  padding: 16,
  fontSize: 16,
  color: '#111827',
};

const actionButtonsRowStyle = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 24,
};

const cancelButtonStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const cancelButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#6B7280',
};

const saveButtonStyle = {
  flex: 1,
  backgroundColor: '#3B82F6',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const saveButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const deleteButtonStyle = {
  backgroundColor: '#EF4444',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginTop: 10,
};

const deleteButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};
