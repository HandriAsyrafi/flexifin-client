import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  transactionService,
  categoryService,
  walletService,
  Transaction,
  Category,
  Wallet,
} from '../services/authService';
import {
  formatCurrency,
  formatDate,
  getAmountColor as getAmountColorFromHelper,
  formatDisplayCurrency,
  findRepaymentCategoryId,
  calculateRemainingAmount,
  isTransactionFullyPaid,
  getTotalRepayments,
} from '../utils/categoryHelper';

interface RouteParams {
  transaction: Transaction;
  transactionType: 'debt' | 'loan';
}

interface RepaymentModalProps {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  wallets: Wallet[];
  transactionType: 'debt' | 'loan';
  onClose: () => void;
  onConfirm: (amount: number, date: string) => void;
}

const RepaymentModal: React.FC<RepaymentModalProps> = ({
  visible,
  transaction,
  categories,
  wallets,
  transactionType,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible && transaction) {
      setDate(new Date());
      setAmount('');
    }
  }, [visible, transaction]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w) => w._id === walletId);
    return wallet?.name || 'Unknown Wallet';
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    const remainingAmount = transaction ? calculateRemainingAmount(transaction) : 0;

    if (!amount || amount.trim() === '' || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid repayment amount');
      return;
    }

    if (numAmount > remainingAmount) {
      Alert.alert('Error', 'Repayment amount cannot exceed the remaining amount');
      return;
    }

    if (!date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    if (!transaction?.walletId || !transaction?.categoryId) {
      Alert.alert(
        'Error',
        'Transaction missing required information. Please refresh and try again.'
      );
      return;
    }

    const formattedDate = date.toISOString().split('T')[0];
    onConfirm(numAmount, formattedDate);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalOverlayStyle}>
        <View style={modalContentStyle}>
          <Text style={modalTitleStyle}>Add Repayment</Text>

          <Text style={modalLabelStyle}>Category:</Text>
          <Text style={modalValueStyle}>
            {transaction ? getCategoryName(transaction.categoryId) : ''}
          </Text>

          <Text style={modalLabelStyle}>Wallet:</Text>
          <Text style={modalValueStyle}>
            {transaction ? getWalletName(transaction.walletId) : 'Unknown Wallet'}
          </Text>

          <Text style={modalLabelStyle}>Remaining Amount:</Text>
          <Text style={modalCurrentAmountStyle}>
            {transaction
              ? formatDisplayCurrency(calculateRemainingAmount(transaction), transactionType)
                  .formattedAmount
              : ''}
          </Text>

          <Text style={modalLabelStyle}>Repayment Amount:</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            style={modalInputStyle}
          />

          <Text style={modalLabelStyle}>Date:</Text>
          <TouchableOpacity onPress={openDatePicker} style={modalDatePickerStyle}>
            <Text style={modalDatePickerTextStyle}>{formatDate(date.toISOString())}</Text>
            <Icon name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
          )}

          <View style={modalButtonsStyle}>
            <TouchableOpacity onPress={onClose} style={modalCancelButtonStyle}>
              <Text style={modalCancelButtonTextStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={modalConfirmButtonStyle}>
              <Text style={modalConfirmButtonTextStyle}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const DebtLoanDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { transaction: initialTransaction, transactionType } = route.params as RouteParams;
  const [transaction, setTransaction] = useState<Transaction>(initialTransaction);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  console.log(transaction, '<<<<<<<<<< transaction');

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadWallets = useCallback(async () => {
    try {
      const response = await walletService.getWallets();
      setWallets(response.data || []);
    } catch (error: any) {
      console.error('Error loading wallets:', error);
    }
  }, []);
  const refreshTransaction = useCallback(async () => {
    try {
      setLoading(true);
      // console.log('Refreshing transaction with ID:', transaction._id);
      const response = await transactionService.getTransactionById(transaction._id);
      // console.log('Transaction refresh response:', response.data);
      if (response.data) {
        setTransaction(response.data);
        // console.log('Transaction updated with repayments:', response.data.repayments);
      }
    } catch (error: any) {
      console.error('Error refreshing transaction:', error);
      Alert.alert('Error', 'Failed to refresh transaction details');
    } finally {
      setLoading(false);
    }
  }, [transaction._id]);
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadCategories(), loadWallets(), refreshTransaction()]);
    };
    loadData();
  }, [loadCategories, loadWallets, refreshTransaction]);

  // Refresh transaction data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshTransaction();
    }, [refreshTransaction])
  );

  const getCategoryById = (categoryId: string) => {
    return categories.find((cat) => cat._id === categoryId);
  };

  const getWalletById = (walletId: string) => {
    return wallets.find((wallet) => wallet._id === walletId);
  };

  const handleRepayment = async (newAmount: number, repaymentDate: string) => {
    try {
      const categoryType = transaction.category?.type;
      if (!categoryType) {
        Alert.alert('Error', 'Unable to determine transaction category. Please try again.');
        return;
      }

      const repaymentCategoryId = await findRepaymentCategoryId(categoryType);
      if (!repaymentCategoryId) {
        Alert.alert('Error', 'Unable to find appropriate repayment category. Please try again.');
        return;
      }

      const repaymentData = {
        walletId: transaction.walletId,
        categoryId: repaymentCategoryId,
        amount: newAmount,
        date: repaymentDate,
      };

      await transactionService.repayTransaction(transaction._id, repaymentData);
      setModalVisible(false);

      const currentRemainingAmount = calculateRemainingAmount(transaction);
      const newRemainingAmount = currentRemainingAmount - newAmount;

      if (newRemainingAmount <= 0) {
        Alert.alert(
          'Success',
          `Full repayment of ${formatCurrency(newAmount)} processed successfully! This ${transactionType} is now fully paid.`
        );
      } else {
        Alert.alert(
          'Success',
          `Repayment of ${formatCurrency(newAmount)} processed successfully on ${formatDate(repaymentDate)}.`
        );
      }

      await refreshTransaction();
    } catch (error: any) {
      console.error('Error processing repayment:', error);
      Alert.alert('Error', error.message || 'Failed to process repayment');
    }
  };

  const getAmountColor = (type: string) => {
    return getAmountColorFromHelper(type);
  };

  const category = getCategoryById(transaction.categoryId);
  const wallet = getWalletById(transaction.walletId);
  const remainingAmount = calculateRemainingAmount(transaction);
  const totalPaid = getTotalRepayments(transaction);
  const isFullyPaid = isTransactionFullyPaid(transaction);
  const repayments = transaction.repayments || [];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={screenBackgroundStyle}>
        {/* Header */}

        <View style={headerContainerStyle}>
          <TouchableOpacity onPress={navigation.goBack} style={backButtonStyle}>
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={headerTitleContainerStyle}>
            <Text style={headerTitleStyle}>
              {transactionType === 'debt' ? 'Debt' : 'Loan'} Detail
            </Text>
            <Text style={headerSubtitleStyle}>Transaction details and repayment history</Text>
          </View>
        </View>

        <ScrollView style={scrollViewStyle} showsVerticalScrollIndicator={false}>
          {/* Transaction Overview Card */}
          <View style={overviewCardStyle}>
            <View style={overviewHeaderStyle}>
              <View
                style={[
                  iconContainerStyle,
                  { backgroundColor: `${getAmountColor(transactionType)}20` },
                ]}>
                <Icon
                  name={transactionType === 'debt' ? 'remove-circle-outline' : 'add-circle-outline'}
                  size={24}
                  color={getAmountColor(transactionType)}
                />
              </View>
              <View style={overviewTitleContainerStyle}>
                <Text style={overviewTitleStyle}>{category?.name || 'Unknown Category'}</Text>
                <Text style={overviewSubtitleStyle}>{wallet?.name || 'Unknown Wallet'}</Text>
              </View>
              <View style={statusBadgeContainerStyle}>
                {isFullyPaid ? (
                  <View style={paidBadgeStyle}>
                    <Text style={paidBadgeTextStyle}>PAID</Text>
                  </View>
                ) : (
                  <View style={activeBadgeStyle}>
                    <Text style={activeBadgeTextStyle}>ACTIVE</Text>
                  </View>
                )}
              </View>
            </View>

            {transaction.description && (
              <Text style={descriptionStyle}>{transaction.description}</Text>
            )}

            <Text style={dateStyle}>Created on {formatDate(transaction.date)}</Text>

            {/* Amount Details */}
            <View style={amountDetailsStyle}>
              <View style={amountRowStyle}>
                <Text style={amountLabelStyle}>Original Amount:</Text>
                <Text style={[amountValueStyle, { color: getAmountColor(transactionType) }]}>
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>

              {totalPaid > 0 && (
                <View style={amountRowStyle}>
                  <Text style={amountLabelStyle}>Total Paid:</Text>
                  <Text style={[amountValueStyle, { color: '#10B981' }]}>
                    {formatCurrency(totalPaid)}
                  </Text>
                </View>
              )}

              <View style={[amountRowStyle, remainingAmountRowStyle]}>
                <Text style={remainingAmountLabelStyle}>Remaining Amount:</Text>
                <Text
                  style={[
                    remainingAmountValueStyle,
                    { color: isFullyPaid ? '#10B981' : getAmountColor(transactionType) },
                  ]}>
                  {formatCurrency(remainingAmount)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            {transaction.amount > 0 && (
              <View style={progressContainerStyle}>
                <View style={progressBarBackgroundStyle}>
                  <View
                    style={[
                      progressBarFillStyle,
                      {
                        width: `${Math.min((totalPaid / transaction.amount) * 100, 100)}%`,
                        backgroundColor: isFullyPaid ? '#10B981' : '#3B82F6',
                      },
                    ]}
                  />
                </View>
                <Text style={progressTextStyle}>
                  {Math.round((totalPaid / transaction.amount) * 100)}% paid
                </Text>
              </View>
            )}

            {/* Repayment Button */}
            {!isFullyPaid && (
              <TouchableOpacity onPress={() => setModalVisible(true)} style={repaymentButtonStyle}>
                <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={repaymentButtonTextStyle}>Add Repayment</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Repayment History */}
          <View style={historyCardStyle}>
            <Text style={historyTitleStyle}>Repayment History</Text>

            {loading ? (
              <View style={loadingContainerStyle}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={loadingTextStyle}>Loading...</Text>
              </View>
            ) : repayments.length === 0 ? (
              <View style={emptyHistoryStyle}>
                <Icon name="document-outline" size={48} color="#D1D5DB" />
                <Text style={emptyHistoryTitleStyle}>No repayments yet</Text>
                <Text style={emptyHistoryDescriptionStyle}>
                  Repayment history will appear here once you make your first payment.
                </Text>
              </View>
            ) : (
              <View style={historyListStyle}>
                {repayments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((repayment, index) => (
                    <View key={index} style={historyItemStyle}>
                      <View style={historyItemContentStyle}>
                        <View style={historyIconContainerStyle}>
                          <Icon name="checkmark-circle" size={20} color="#10B981" />
                        </View>
                        <View style={historyContentStyle}>
                          <Text style={historyAmountStyle}>
                            {formatCurrency(Math.abs(repayment.amount))}
                          </Text>
                          <Text style={historyDateStyle}>{formatDate(repayment.date)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Repayment Modal */}
        <RepaymentModal
          visible={modalVisible}
          transaction={transaction}
          categories={categories}
          wallets={wallets}
          transactionType={transactionType}
          onClose={() => setModalVisible(false)}
          onConfirm={handleRepayment}
        />
      </View>
    </>
  );
};

// Styles
const screenBackgroundStyle = {
  flex: 1,
  backgroundColor: '#F8FAFC',
};

const headerContainerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 20,
  paddingHorizontal: 24,
  paddingBottom: 24,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const backButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: 16,
};

const headerTitleContainerStyle = {
  flex: 1,
};

const headerTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  letterSpacing: -0.5,
};

const headerSubtitleStyle = {
  fontSize: 14,
  color: '#6B7280',
  marginTop: 2,
};

const scrollViewStyle = {
  flex: 1,
  paddingHorizontal: 24,
  paddingTop: 24,
};

const overviewCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 24,
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 6,
};

const overviewHeaderStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  marginBottom: 16,
};

const iconContainerStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: 12,
};

const overviewTitleContainerStyle = {
  flex: 1,
};

const overviewTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 2,
};

const overviewSubtitleStyle = {
  fontSize: 14,
  color: '#6B7280',
};

const statusBadgeContainerStyle = {
  alignItems: 'flex-end' as const,
};

const paidBadgeStyle = {
  backgroundColor: '#10B981',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
};

const paidBadgeTextStyle = {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 'bold' as const,
  letterSpacing: 0.5,
};

const activeBadgeStyle = {
  backgroundColor: '#F59E0B',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
};

const activeBadgeTextStyle = {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 'bold' as const,
  letterSpacing: 0.5,
};

const descriptionStyle = {
  fontSize: 16,
  color: '#4B5563',
  marginBottom: 8,
  lineHeight: 22,
};

const dateStyle = {
  fontSize: 14,
  color: '#9CA3AF',
  marginBottom: 20,
};

const amountDetailsStyle = {
  marginBottom: 20,
};

const amountRowStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 8,
};

const remainingAmountRowStyle = {
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  paddingTop: 12,
  marginTop: 8,
};

const amountLabelStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const amountValueStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const,
};

const remainingAmountLabelStyle = {
  fontSize: 16,
  color: '#1F2937',
  fontWeight: '600' as const,
};

const remainingAmountValueStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
};

const progressContainerStyle = {
  marginBottom: 20,
};

const progressBarBackgroundStyle = {
  height: 8,
  backgroundColor: '#E5E7EB',
  borderRadius: 4,
  marginBottom: 8,
};

const progressBarFillStyle = {
  height: '100%' as const,
  borderRadius: 4,
};

const progressTextStyle = {
  fontSize: 12,
  color: '#6B7280',
  textAlign: 'center' as const,
  fontWeight: '500' as const,
};

const repaymentButtonStyle = {
  backgroundColor: '#3B82F6',
  borderRadius: 12,
  paddingVertical: 14,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 8,
};

const repaymentButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
};

const historyCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 24,
  marginBottom: 40,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 6,
};

const historyTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 16,
};

const loadingContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingVertical: 40,
  gap: 12,
};

const loadingTextStyle = {
  color: '#6B7280',
  fontSize: 14,
};

const emptyHistoryStyle = {
  alignItems: 'center' as const,
  paddingVertical: 40,
};

const emptyHistoryTitleStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#9CA3AF',
  marginTop: 16,
  marginBottom: 8,
};

const emptyHistoryDescriptionStyle = {
  fontSize: 14,
  color: '#9CA3AF',
  textAlign: 'center' as const,
  lineHeight: 20,
  paddingHorizontal: 20,
};

const historyListStyle = {
  gap: 12,
};

const historyItemStyle = {
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
};

const historyItemContentStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const historyIconContainerStyle = {
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: '#10B98120',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: 12,
};

const historyContentStyle = {
  flex: 1,
};

const historyAmountStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const,
  color: '#10B981',
  marginBottom: 2,
};

const historyDateStyle = {
  fontSize: 12,
  color: '#6B7280',
};

// Modal styles
const modalOverlayStyle = {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  paddingHorizontal: 16,
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 24,
  width: '100%' as const,
  maxWidth: 320,
};

const modalTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 20,
  textAlign: 'center' as const,
};

const modalLabelStyle = {
  color: '#6B7280',
  marginBottom: 8,
  marginTop: 8,
  fontSize: 14,
  fontWeight: '500' as const,
};

const modalValueStyle = {
  color: '#1F2937',
  fontWeight: '500' as const,
  marginBottom: 8,
  fontSize: 15,
};

const modalCurrentAmountStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#EF4444',
  marginBottom: 16,
};

const modalInputStyle = {
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 8,
  color: '#1F2937',
  fontSize: 16,
};

const modalDatePickerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 12,
  marginBottom: 8,
  backgroundColor: '#F9FAFB',
};

const modalDatePickerTextStyle = {
  color: '#1F2937',
  fontSize: 16,
  fontWeight: '500' as const,
};

const modalButtonsStyle = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 16,
};

const modalCancelButtonStyle = {
  flex: 1,
  backgroundColor: '#F3F4F6',
  borderRadius: 8,
  paddingVertical: 12,
};

const modalCancelButtonTextStyle = {
  color: '#1F2937',
  fontWeight: '500' as const,
  textAlign: 'center' as const,
  fontSize: 16,
};

const modalConfirmButtonStyle = {
  flex: 1,
  backgroundColor: '#3B82F6',
  borderRadius: 8,
  paddingVertical: 12,
};

const modalConfirmButtonTextStyle = {
  color: '#FFFFFF',
  fontWeight: '500' as const,
  textAlign: 'center' as const,
  fontSize: 16,
};

export default DebtLoanDetailScreen;
