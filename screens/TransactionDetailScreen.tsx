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
import {
  transactionService,
  walletService,
  categoryService,
  type Transaction,
  type CreateTransactionData,
  type Wallet,
  type Category,
} from '../services/authService';

interface RouteParams {
  transactionId: string;
}

export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { transactionId } = route.params as RouteParams;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateTransactionData>({
    walletId: '',
    categoryId: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadTransactionDetail();
    loadWalletsAndCategories();
  }, [transactionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTransactionDetail = async () => {
    setIsLoading(true);
    try {
      const response = await transactionService.getTransactionById(transactionId);
      const transactionData = response.data;
      setTransaction(transactionData);

      // Set form data
      setFormData({
        walletId: transactionData.walletId,
        categoryId: transactionData.categoryId,
        amount: transactionData.amount,
        description: transactionData.description || '',
        date: new Date(transactionData.date).toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Error loading transaction detail:', error);
      Alert.alert('Error', error.message || 'Failed to load transaction details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadWalletsAndCategories = async () => {
    try {
      const [walletsResponse, categoriesResponse] = await Promise.all([
        walletService.getWallets(),
        categoryService.getCategories(),
      ]);
      setWallets(walletsResponse.data);

      // If no categories exist, initialize default categories
      if (categoriesResponse.data.length === 0) {
        console.log('No categories found, initializing default categories...');
        const initResponse = await categoryService.initializeCategories();
        setCategories(initResponse.data);
      } else {
        setCategories(categoriesResponse.data);
      }
    } catch (error: any) {
      console.error('Error loading wallets and categories:', error);
      Alert.alert('Error', error.message || 'Failed to load data');
    }
  };

  const handleInputChange = (field: keyof CreateTransactionData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberInput = (value: string) => {
    const numericValue = Number(value);
    setFormData((prev) => ({
      ...prev,
      amount: value === '' || isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      setFormData((prev) => ({
        ...prev,
        date: dateString,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.walletId) {
      Alert.alert('Error', 'Please select a wallet');
      return false;
    }

    if (!formData.categoryId) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }

    if (formData.amount <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await transactionService.updateTransaction(transactionId, formData);
      Alert.alert('Success', 'Transaction updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditing(false);
            loadTransactionDetail(); // Reload data
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', error.message || 'Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this transaction? This action cannot be undone and will affect your wallet balance.`,
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
      await transactionService.deleteTransaction(transactionId);
      Alert.alert('Success', 'Transaction deleted successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', error.message || 'Failed to delete transaction');
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return '#10B981'; // green
      case 'expense':
        return '#EF4444'; // red
      case 'debt':
        return '#F59E0B'; // amber
      case 'loan':
        return '#EF4444'; // red
      case 'repayment-debt':
        return '#EF4444'; // red
      case 'repayment-loan':
        return '#10B981'; // green
      case 'adjustmentNegative':
        return '#EF4444'; // red
      case 'adjustmentPositive':
        return '#10B981'; // green
      case 'transfer':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
    }
  };

  const selectedCategory = categories.find((category) => category._id === formData.categoryId);

  if (isLoading && !transaction) {
    return (
      <View style={loadingContainerStyle}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={loadingTextStyle}>Loading transaction details...</Text>
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
            <Text style={headerTitleStyle}>Transaction Details</Text>
            <Text style={headerSubtitleStyle}>View and manage your transaction</Text>
          </View>
        </View>

        <ScrollView
          style={scrollViewStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}>
          {/* Main Form Card */}
          <View style={mainCardStyle}>
            {/* Wallet Selection Card */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Select Wallet</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <Picker
                  selectedValue={formData.walletId}
                  onValueChange={(value) => handleInputChange('walletId', value)}
                  enabled={isEditing}
                  style={pickerStyle}>
                  <Picker.Item label="Choose a wallet..." value="" />
                  {wallets.map((wallet) => (
                    <Picker.Item
                      key={wallet._id}
                      label={`${wallet.name} (${formatAmount(wallet.balance)})`}
                      value={wallet._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Category Selection Card */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Select Category</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <Picker
                  selectedValue={formData.categoryId}
                  onValueChange={(value) => handleInputChange('categoryId', value)}
                  enabled={isEditing}
                  style={pickerStyle}>
                  <Picker.Item label="Choose a category..." value="" />
                  {categories.map((category) => (
                    <Picker.Item
                      key={category._id}
                      label={`${category.name} (${category.type})`}
                      value={category._id}
                    />
                  ))}
                </Picker>
              </View>
              {selectedCategory && (
                <View style={categoryInfoCardStyle}>
                  <View className="flex-row items-center">
                    <View
                      style={[
                        categoryDotStyle,
                        {
                          backgroundColor: getTransactionTypeColor(selectedCategory.type),
                        },
                      ]}
                    />
                    <Text style={categoryTypeStyle}>{selectedCategory.type} category</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Amount Input Card */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Amount</Text>
              <View style={[inputContainerStyle, !isEditing && disabledInputStyle]}>
                <TextInput
                  style={textInputStyle}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  value={formData.amount > 0 ? formData.amount.toString() : ''}
                  onChangeText={handleNumberInput}
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Description Input Card */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Description (Optional)</Text>
              <View style={[inputContainerStyle, textAreaStyle, !isEditing && disabledInputStyle]}>
                <TextInput
                  style={[textInputStyle, { height: 80 }]}
                  placeholder="Enter description"
                  placeholderTextColor="#9CA3AF"
                  value={formData.description || ''}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={isEditing}
                />
              </View>
            </View>

            {/* Date Selection Card */}
            <View style={cardSectionStyle}>
              <Text style={labelStyle}>Transaction Date</Text>
              <TouchableOpacity
                style={[inputContainerStyle, !isEditing && disabledInputStyle]}
                onPress={() => isEditing && setShowDatePicker(true)}>
                <Text style={dateTextStyle}>
                  {new Date(formData.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(formData.date)}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Action Buttons */}
            {isEditing ? (
              <View style={actionButtonRowStyle}>
                <TouchableOpacity
                  style={cancelButtonStyle}
                  onPress={() => {
                    setIsEditing(false);
                    // Reset form data
                    if (transaction) {
                      setFormData({
                        walletId: transaction.walletId,
                        categoryId: transaction.categoryId,
                        amount: transaction.amount,
                        description: transaction.description || '',
                        date: new Date(transaction.date).toISOString().split('T')[0],
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
              <View style={actionButtonRowStyle}>
                {/* Make Repayment Button for debt and loan transactions */}
                {selectedCategory &&
                  (selectedCategory.type === 'debt' || selectedCategory.type === 'loan') && (
                    <TouchableOpacity
                      style={repaymentButtonStyle}
                      onPress={() => {
                        // Navigate to debt/loan screen for repayment
                        navigation.navigate('DebtLoan' as never);
                      }}>
                      <Text style={repaymentButtonTextStyle}>Make Repayment</Text>
                    </TouchableOpacity>
                  )}
                <TouchableOpacity
                  style={deleteButtonStyle}
                  onPress={handleDelete}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={deleteButtonTextStyle}>Delete Transaction</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// Modern Financial App Style Objects
const modernBackgroundStyle = {
  flex: 1,
  backgroundColor: '#F9FAFB',
};

const headerContainerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 60,
  paddingHorizontal: 20,
  paddingBottom: 20,
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

const textAreaStyle = {
  minHeight: 80,
  alignItems: 'flex-start' as const,
  paddingVertical: 12,
};

const dateTextStyle = {
  padding: 16,
  fontSize: 16,
  color: '#111827',
};

const pickerStyle = {
  height: 50,
  color: '#111827',
};

const categoryInfoCardStyle = {
  backgroundColor: '#F8F9FA',
  borderRadius: 12,
  padding: 16,
  marginTop: 14,
  borderWidth: 1,
  borderColor: '#E9ECEF',
};

const categoryDotStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginRight: 10,
};

const categoryTypeStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500' as const,
  textTransform: 'capitalize' as const,
  letterSpacing: -0.1,
};

const actionButtonRowStyle = {
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
  flex: 1,
  backgroundColor: '#EF4444',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginTop: 12,
};

const deleteButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const repaymentButtonStyle = {
  flex: 1,
  backgroundColor: '#10B981',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const repaymentButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};
