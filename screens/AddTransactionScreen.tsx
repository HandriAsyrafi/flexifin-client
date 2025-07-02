import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  transactionService,
  walletService,
  categoryService,
  type CreateTransactionData,
  type Wallet,
  type Category,
} from '../services/authService';

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<CreateTransactionData>({
    walletId: '',
    categoryId: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    'income' | 'expense' | 'debt' | 'transfer' | ''
  >('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<
    'income' | 'expense' | 'debt' | 'transfer'
  >('expense');

  useEffect(() => {
    loadWalletsAndCategories();
  }, []);

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData: CreateTransactionData = {
        ...formData,
        amount: Number(formData.amount),
      };

      await transactionService.createTransaction(submitData);

      Alert.alert('Success', 'Transaction created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      Alert.alert('Error', error.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat._id === formData.categoryId);

  // Helper function to get filtered categories based on selected transaction type
  const getFilteredCategories = () => {
    if (!selectedTransactionType) {
      return categories;
    }
    return categories.filter((category) => category.type === selectedTransactionType);
  };

  // Handle transaction type change
  const handleTransactionTypeChange = (type: 'income' | 'expense' | 'debt' | 'transfer' | '') => {
    setSelectedTransactionType(type);
    // Reset category selection when transaction type changes
    setFormData((prev) => ({ ...prev, categoryId: '' }));
  };

  // Handle add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }

    try {
      await categoryService.createCategory({
        name: newCategoryName.trim(),
        type: newCategoryType,
      });

      // Reload categories
      await loadWalletsAndCategories();

      // Reset form
      setNewCategoryName('');
      setNewCategoryType('expense');
      setShowAddCategoryModal(false);

      Alert.alert('Success', 'Category created successfully!');
    } catch (error: any) {
      console.error('Error creating category:', error);
      Alert.alert('Error', error.message || 'Failed to create category');
    }
  };

  // Handle delete category
  const handleDeleteCategory = (categoryId: string, categoryName: string, isDeletable: boolean) => {
    if (!isDeletable) {
      Alert.alert('Error', 'This category cannot be deleted');
      return;
    }

    Alert.alert('Delete Category', `Are you sure you want to delete "${categoryName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await categoryService.deleteCategory(categoryId);
            await loadWalletsAndCategories();

            // Reset category selection if deleted category was selected
            if (formData.categoryId === categoryId) {
              setFormData((prev) => ({ ...prev, categoryId: '' }));
            }

            Alert.alert('Success', 'Category deleted successfully!');
          } catch (error: any) {
            console.error('Error deleting category:', error);
            Alert.alert('Error', error.message || 'Failed to delete category');
          }
        },
      },
    ]);
  };

  // Get category description based on category name and type
  const getCategoryDescription = (name: string, type: string): string => {
    const descriptions: { [key: string]: string } = {
      // Income descriptions
      Salary: 'Regular income from employment',
      Freelance: 'Income from freelance work or gigs',
      Investment: 'Returns from investments, dividends, etc.',
      Business: 'Income from business operations',
      Gift: 'Money received as gifts or donations',

      // Expense descriptions
      'Food & Dining': 'Meals, groceries, restaurants',
      Transportation: 'Fuel, public transport, parking',
      Shopping: 'Clothes, electronics, household items',
      Entertainment: 'Movies, games, subscriptions',
      'Bills & Utilities': 'Electricity, water, internet, phone',
      Healthcare: 'Medical expenses, medicine, insurance',
      Education: 'School fees, courses, books',
      'Personal Care': 'Grooming, skincare, salon',
      Home: 'Rent, maintenance, furniture',
      Travel: 'Vacation, trips, accommodation',

      // Debt descriptions
      'Credit Card': 'Credit card payments and interest',
      Loan: 'Personal loan payments',
      Mortgage: 'Home loan payments',

      // Transfer descriptions
      'Wallet Transfer': 'Transfer between your wallets',
      'Bank Transfer': 'Transfer to/from bank accounts',
    };

    return descriptions[name] || `${type} transaction`;
  };

  // Get type description
  const getTypeDescription = (type: string): string => {
    const typeDescriptions: { [key: string]: string } = {
      income: 'Money you receive: salary, freelance, investments, business income, gifts',
      expense: 'Money you spend: food, transport, shopping, bills, entertainment, healthcare',
      debt: 'Money you owe: credit cards, loans, mortgages',
      transfer: 'Money movement: between wallets or bank accounts',
    };

    return typeDescriptions[type] || '';
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
            <Text style={styles.headerTitleStyle}>Add Transaction</Text>
            <Text style={styles.headerSubtitleStyle}>Create a new financial record</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentStyle}>
          {/* Main Form Card */}
          <View style={styles.mainCardStyle}>
            {/* Wallet Selection Card */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Select Wallet</Text>
              <View style={styles.inputContainerStyle}>
                <Picker
                  selectedValue={formData.walletId}
                  onValueChange={(value) => handleInputChange('walletId', value)}
                  style={styles.pickerStyle}>
                  <Picker.Item label="Choose a wallet..." value="" />
                  {wallets.map((wallet) => (
                    <Picker.Item
                      key={wallet._id}
                      label={`${wallet.name} (Rp ${wallet.balance.toLocaleString('id-ID')})`}
                      value={wallet._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Category Selection Card */}
            <View style={styles.cardSectionStyle}>
              <View style={styles.categoryHeaderStyle}>
                <Text style={styles.labelStyle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setShowAddCategoryModal(true)}
                  style={styles.addButtonStyle}>
                  <Text style={styles.addButtonTextStyle}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Transaction Type Filter */}
              <View style={styles.typeFilterSectionStyle}>
                <Text style={styles.subLabelStyle}>Filter by Type (Optional)</Text>
                <View style={styles.inputContainerStyle}>
                  <Picker
                    selectedValue={selectedTransactionType}
                    onValueChange={(value) => handleTransactionTypeChange(value as any)}
                    style={styles.pickerStyle}>
                    <Picker.Item label="All Categories" value="" />
                    <Picker.Item label="💰 Income" value="income" />
                    <Picker.Item label="💳 Expense" value="expense" />
                    <Picker.Item label="🏦 Debt" value="debt" />
                    <Picker.Item label="↔️ Transfer" value="transfer" />
                  </Picker>
                </View>

                {/* Type Description */}
                {selectedTransactionType && (
                  <View style={styles.typeDescriptionStyle}>
                    <Text style={styles.typeDescriptionTextStyle}>
                      {getTypeDescription(selectedTransactionType)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Category Dropdown */}
              <View style={styles.inputContainerStyle}>
                <Picker
                  selectedValue={formData.categoryId}
                  onValueChange={(value) => handleInputChange('categoryId', value)}
                  style={styles.pickerStyle}>
                  <Picker.Item label="Choose a category..." value="" />
                  {getFilteredCategories().map((category) => (
                    <Picker.Item
                      key={category._id}
                      label={`${category.name} ${!category.isDeletable ? '(Default)' : ''}`}
                      value={category._id}
                    />
                  ))}
                </Picker>
              </View>

              {/* Categories Info Panel */}
              {getFilteredCategories().length > 0 && (
                <View style={styles.categoriesInfoPanelStyle}>
                  <Text style={styles.categoriesInfoTitleStyle}>
                    Available Categories ({getFilteredCategories().length})
                  </Text>
                  <View style={styles.categoriesGridStyle}>
                    {getFilteredCategories()
                      .slice(0, 6)
                      .map((category) => (
                        <TouchableOpacity
                          key={category._id}
                          style={[
                            styles.categoryChipStyle,
                            formData.categoryId === category._id &&
                              styles.categoryChipSelectedStyle,
                          ]}
                          onPress={() => handleInputChange('categoryId', category._id)}>
                          <View
                            style={[
                              styles.categoryChipDotStyle,
                              {
                                backgroundColor:
                                  category.type === 'income'
                                    ? '#10B981'
                                    : category.type === 'expense'
                                      ? '#EF4444'
                                      : category.type === 'debt'
                                        ? '#F59E0B'
                                        : '#3B82F6',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryChipTextStyle,
                              formData.categoryId === category._id &&
                                styles.categoryChipTextSelectedStyle,
                            ]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    {getFilteredCategories().length > 6 && (
                      <View style={styles.categoryChipMoreStyle}>
                        <Text style={styles.categoryChipMoreTextStyle}>
                          +{getFilteredCategories().length - 6} more
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Category Info */}
              {selectedCategory && (
                <View style={styles.categoryInfoCardStyle}>
                  <View style={styles.categoryInfoRowStyle}>
                    <View style={styles.categoryInfoContentStyle}>
                      <View style={styles.categoryInfoHeaderStyle}>
                        <View
                          style={[
                            styles.categoryDotStyle,
                            {
                              backgroundColor:
                                selectedCategory.type === 'income'
                                  ? '#10B981'
                                  : selectedCategory.type === 'expense'
                                    ? '#EF4444'
                                    : selectedCategory.type === 'debt'
                                      ? '#F59E0B'
                                      : '#3B82F6',
                            },
                          ]}
                        />
                        <Text style={styles.categoryTypeStyle}>
                          {selectedCategory.type.toUpperCase()} CATEGORY
                        </Text>
                        {!selectedCategory.isDeletable && (
                          <View style={styles.defaultCategoryBadgeStyle}>
                            <Text style={styles.defaultCategoryBadgeTextStyle}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.selectedCategoryNameStyle}>{selectedCategory.name}</Text>
                      <Text style={styles.categoryDescriptionStyle}>
                        {getCategoryDescription(selectedCategory.name, selectedCategory.type)}
                      </Text>
                    </View>
                    {selectedCategory.isDeletable && (
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteCategory(
                            selectedCategory._id,
                            selectedCategory.name,
                            selectedCategory.isDeletable
                          )
                        }
                        style={styles.deleteButtonStyle}>
                        <Text style={styles.deleteButtonTextStyle}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Amount Input Card */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Amount</Text>
              <View style={styles.inputContainerStyle}>
                <TextInput
                  style={styles.textInputStyle}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  value={formData.amount > 0 ? formData.amount.toString() : ''}
                  onChangeText={handleNumberInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Description Input Card */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Description (Optional)</Text>
              <View style={[styles.inputContainerStyle, styles.textAreaStyle]}>
                <TextInput
                  style={[styles.textInputStyle, { height: 80 }]}
                  placeholder="Enter description"
                  placeholderTextColor="#9CA3AF"
                  value={formData.description || ''}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Date Selection Card */}
            <View style={styles.cardSectionStyle}>
              <Text style={styles.labelStyle}>Transaction Date</Text>
              <TouchableOpacity
                style={styles.inputContainerStyle}
                onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateTextStyle}>
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

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButtonStyle, loading && styles.submitButtonDisabledStyle]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonTextStyle}>Create Transaction</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Category Modal */}
        <Modal
          visible={showAddCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddCategoryModal(false)}>
          <View style={styles.modalOverlayStyle}>
            <View style={styles.modalContentStyle}>
              <Text style={styles.modalTitleStyle}>Add New Category</Text>

              {/* Category Name */}
              <View style={styles.modalSectionStyle}>
                <Text style={styles.modalLabelStyle}>Category Name *</Text>
                <View style={styles.inputContainerStyle}>
                  <TextInput
                    style={styles.textInputStyle}
                    placeholder="Enter category name"
                    placeholderTextColor="#9CA3AF"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                  />
                </View>
              </View>

              {/* Category Type */}
              <View style={styles.modalSectionStyle}>
                <Text style={styles.modalLabelStyle}>Category Type *</Text>
                <View style={styles.inputContainerStyle}>
                  <Picker
                    selectedValue={newCategoryType}
                    onValueChange={(value) => setNewCategoryType(value as any)}
                    style={styles.pickerStyle}>
                    <Picker.Item label="Expense" value="expense" />
                    <Picker.Item label="Income" value="income" />
                    <Picker.Item label="Debt" value="debt" />
                    <Picker.Item label="Transfer" value="transfer" />
                  </Picker>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtonRowStyle}>
                <TouchableOpacity
                  style={styles.modalCancelButtonStyle}
                  onPress={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryType('expense');
                  }}
                  activeOpacity={0.8}>
                  <Text style={styles.modalButtonTextStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButtonStyle}
                  onPress={handleAddCategory}
                  activeOpacity={0.8}>
                  <Text style={styles.modalButtonTextStyle}>Add Category</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    marginBottom: 10,
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

  subLabelStyle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
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

  textAreaStyle: {
    minHeight: 100,
    textAlignVertical: 'top',
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

  categoryHeaderStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  addButtonStyle: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  addButtonTextStyle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  typeFilterSectionStyle: {
    marginBottom: 16,
  },

  typeDescriptionStyle: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },

  typeDescriptionTextStyle: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  categoriesInfoPanelStyle: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  categoriesInfoTitleStyle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  categoriesGridStyle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  categoryChipStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 2,
  },

  categoryChipSelectedStyle: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },

  categoryChipDotStyle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  categoryChipTextStyle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  categoryChipTextSelectedStyle: {
    color: '#3B82F6',
  },

  categoryChipMoreStyle: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryChipMoreTextStyle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  categoryInfoCardStyle: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
  },

  categoryInfoRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  categoryInfoContentStyle: {
    flex: 1,
  },

  categoryInfoHeaderStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  categoryDotStyle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },

  categoryTypeStyle: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  defaultCategoryBadgeStyle: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },

  defaultCategoryBadgeTextStyle: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },

  selectedCategoryNameStyle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  categoryDescriptionStyle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  deleteButtonStyle: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  deleteButtonTextStyle: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
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

  // Modal Styles
  modalOverlayStyle: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContentStyle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  modalTitleStyle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },

  modalSectionStyle: {
    marginBottom: 16,
  },

  modalLabelStyle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  modalButtonRowStyle: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  modalCancelButtonStyle: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  modalConfirmButtonStyle: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  modalButtonTextStyle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
