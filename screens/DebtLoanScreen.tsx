import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  transactionService,
  categoryService,
  Transaction,
  Category,
} from '../services/authService';
import {
  formatCurrency,
  formatDate,
  getAmountColor as getAmountColorFromHelper,
  formatDisplayCurrency,
  calculateRemainingAmount,
  isTransactionFullyPaid,
  getTotalRepayments,
} from '../utils/categoryHelper';

type FilterType = 'debt' | 'loan';

const DebtLoanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('debt');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (activeFilter === 'debt') {
        response = await transactionService.getDebtTransactions();
      } else {
        response = await transactionService.getLoanTransactions();
      }

      // Sort transactions: active ones (amount > 0) first, then paid ones (amount = 0)
      const sortedTransactions = (response.data || []).sort((a, b) => {
        if (a.amount > 0 && b.amount === 0) return -1;
        if (a.amount === 0 && b.amount > 0) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTransactions(sortedTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', error.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTransactions(), loadCategories()]);
    setRefreshing(false);
  }, [fetchTransactions, loadCategories]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchTransactions(), loadCategories()]);
    };
    loadData();
  }, [fetchTransactions, loadCategories]);

  const getCategoryById = (categoryId: string) => {
    return categories.find((cat) => cat._id === categoryId);
  };

  const getTransactionIcon = (categoryName: string, type: string) => {
    const iconSize = 20;
    const iconColor = getAmountColor(type);

    const categoryLower = categoryName.toLowerCase();

    // Debt specific icons
    if (type === 'debt') {
      if (categoryLower.includes('loan') || categoryLower.includes('pinjam')) {
        return <Icon name="card" size={iconSize} color={iconColor} />;
      }
      return <Icon name="remove-circle-outline" size={iconSize} color={iconColor} />;
    }

    // Loan specific icons
    if (type === 'loan') {
      return <Icon name="add-circle-outline" size={iconSize} color={iconColor} />;
    }

    return <Icon name="cash-outline" size={iconSize} color={iconColor} />;
  };
  const handleTransactionPress = (transaction: Transaction) => {
    console.log('Navigating to transaction detail:', {
      id: transaction._id,
      originalAmount: transaction.amount,
      remainingAmount: calculateRemainingAmount(transaction),
      walletId: transaction.walletId,
      categoryId: transaction.categoryId,
      description: transaction.description,
      repayments: transaction.repayments,
    });

    // Navigate to detail screen
    navigation.navigate('DebtLoanDetailScreen', {
      transaction: transaction,
      transactionType: activeFilter,
    });
  };
  // Use helper functions for consistent amount display
  const getAmountColor = (type: string) => {
    // Use the helper function from categoryHelper.ts
    return getAmountColorFromHelper(type);
  };

  const formatAmountWithSign = (amount: number, type: string) => {
    const { formattedAmount, color } = formatDisplayCurrency(amount, type);
    return { formattedAmount, color };
  };

  if (loading && transactions.length === 0) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={modernBackgroundStyle}>
          <View style={loadingContainerStyle}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={loadingTextStyle}>Loading {activeFilter} transactions...</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={modernBackgroundStyle}>
        {/* Header Section */}
        <View style={headerContainerStyle}>
          <View className="mb-6">
            <Text style={headerTitleStyle}>Debt & Loan</Text>
            <Text style={headerSubtitleStyle}>Manage your debts and loans</Text>
          </View>

          {/* Filter Buttons */}
          <View style={filterContainerStyle}>
            <TouchableOpacity
              onPress={() => setActiveFilter('debt')}
              style={[filterButtonStyle, activeFilter === 'debt' && filterButtonActiveStyle]}>
              <Text
                style={[
                  filterButtonTextStyle,
                  activeFilter === 'debt' && filterButtonActiveTextStyle,
                ]}>
                Debt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('loan')}
              style={[filterButtonStyle, activeFilter === 'loan' && filterButtonActiveStyle]}>
              <Text
                style={[
                  filterButtonTextStyle,
                  activeFilter === 'loan' && filterButtonActiveTextStyle,
                ]}>
                Loan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Transaction List */}
        <ScrollView
          style={scrollViewStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {transactions.length === 0 ? (
            <View style={emptyStateContainerStyle}>
              <View style={emptyStateCardStyle}>
                <Text style={emptyStateTitleStyle}>No {activeFilter}s found</Text>
                <Text style={emptyStateDescriptionStyle}>
                  You don&apos;t have any {activeFilter} transactions yet.
                </Text>
              </View>
            </View>
          ) : (
            <View style={mainContentStyle}>
              {/* Active Transactions */}
              {transactions.filter((transaction) => calculateRemainingAmount(transaction) > 0)
                .length > 0 && (
                <View style={sectionStyle}>
                  <Text style={sectionTitleStyle}>Active {activeFilter}s</Text>
                  <View style={transactionListStyle}>
                    {transactions
                      .filter((transaction) => calculateRemainingAmount(transaction) > 0)
                      .map((transaction) => {
                        const category = getCategoryById(transaction.categoryId);
                        const categoryName = category?.name || 'Unknown Category';
                        const remainingAmount = calculateRemainingAmount(transaction);

                        return (
                          <TouchableOpacity
                            key={transaction._id}
                            onPress={() => handleTransactionPress(transaction)}
                            style={transactionCardStyle}>
                            <View style={transactionCardContentStyle}>
                              {/* Icon */}
                              <View
                                style={[
                                  transactionIconContainerStyle,
                                  { backgroundColor: `${getAmountColor(activeFilter)}20` },
                                ]}>
                                {getTransactionIcon(categoryName, activeFilter)}
                              </View>
                              {/* Content */}
                              <View style={transactionContentStyle}>
                                <Text style={transactionTitleStyle}>{categoryName}</Text>

                                {transaction.description && (
                                  <Text style={transactionDescriptionStyle}>
                                    {transaction.description}
                                  </Text>
                                )}

                                <Text style={transactionDateStyle}>
                                  {formatDate(transaction.date)}
                                </Text>

                                {/* Show repayment progress if there are repayments */}
                                {transaction.repayments && transaction.repayments.length > 0 && (
                                  <Text style={repaymentProgressStyle}>
                                    Paid: {formatCurrency(getTotalRepayments(transaction))} of
                                    {formatCurrency(transaction.amount)}
                                  </Text>
                                )}
                              </View>
                              {/* Amount */}
                              <View style={transactionAmountContainerStyle}>
                                <Text
                                  style={[
                                    transactionAmountStyle,
                                    { color: getAmountColor(activeFilter) },
                                  ]}>
                                  {
                                    formatAmountWithSign(remainingAmount, activeFilter)
                                      .formattedAmount
                                  }
                                </Text>
                                <Icon name="chevron-forward" size={16} color="#9CA3AF" />
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
              )}
              {/* Paid Transactions */}
              {transactions.filter((transaction) => isTransactionFullyPaid(transaction)).length >
                0 && (
                <View style={sectionStyle}>
                  <Text style={sectionTitleStyle}>Paid {activeFilter}s</Text>
                  <View style={transactionListStyle}>
                    {transactions
                      .filter((transaction) => isTransactionFullyPaid(transaction))
                      .map((transaction) => {
                        const category = getCategoryById(transaction.categoryId);
                        const categoryName = category?.name || 'Unknown Category';

                        return (
                          <TouchableOpacity
                            key={transaction._id}
                            style={paidTransactionCardStyle}
                            onPress={() => handleTransactionPress(transaction)}>
                            <View style={transactionCardContentStyle}>
                              {/* Icon */}
                              <View style={paidTransactionIconContainerStyle}>
                                <Icon name="checkmark-circle" size={20} color="#10B981" />
                              </View>

                              {/* Content */}
                              <View style={transactionContentStyle}>
                                <Text style={paidTransactionTitleStyle}>{categoryName}</Text>

                                {transaction.description && (
                                  <Text style={paidTransactionDescriptionStyle}>
                                    {transaction.description}
                                  </Text>
                                )}

                                <Text style={paidTransactionDateStyle}>
                                  {formatDate(transaction.date)}
                                </Text>
                              </View>

                              {/* Paid Badge */}
                              <View style={paidBadgeStyle}>
                                <Text style={paidBadgeTextStyle}>PAID</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
};

// Styling Constants
const modernBackgroundStyle = {
  backgroundColor: '#F8FAFC',
  flex: 1,
};

const headerContainerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 20,
  paddingHorizontal: 24,
  paddingBottom: 24,
  borderBottomLeftRadius: 28,
  borderBottomRightRadius: 28,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const headerTitleStyle = {
  fontSize: 26,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  letterSpacing: -0.5,
  marginBottom: 2,
};

const headerSubtitleStyle = {
  fontSize: 14,
  color: '#6B7280',
  letterSpacing: -0.1,
  marginBottom: 10,
};

const filterContainerStyle = {
  flexDirection: 'row' as const,
  backgroundColor: '#F3F4F6',
  borderRadius: 16,
  padding: 4,
  marginTop: 8,
};

const filterButtonStyle = {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: 'transparent',
};

const filterButtonActiveStyle = {
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const filterButtonTextStyle = {
  textAlign: 'center' as const,
  fontWeight: '500' as const,
  color: '#6B7280',
  fontSize: 16,
};

const filterButtonActiveTextStyle = {
  color: '#1F2937',
  fontWeight: '600' as const,
};

const scrollViewStyle = {
  flex: 1,
};

const scrollContentStyle = {
  flexGrow: 1,
  paddingHorizontal: 15,
  paddingVertical: 28,
  paddingBottom: 40,
};

const loadingContainerStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingVertical: 80,
};

const loadingTextStyle = {
  marginTop: 16,
  color: '#6B7280',
  fontSize: 16,
  fontWeight: '500' as const,
};

const mainContentStyle = {
  flex: 1,
};

const emptyStateContainerStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 20,
  paddingVertical: 60,
};

const emptyStateCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: 32,
  alignItems: 'center' as const,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
  maxWidth: 320,
  width: '100%' as const,
};

const emptyStateTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 12,
  letterSpacing: -0.3,
};

const emptyStateDescriptionStyle = {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 20,
};

const sectionStyle = {
  marginBottom: 32,
};

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 16,
  letterSpacing: -0.3,
};

const transactionListStyle = {
  gap: 12,
};

const transactionCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
  borderWidth: 1,
  borderColor: '#F1F5F9',
};

const transactionCardContentStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const transactionIconContainerStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: 12,
};

const transactionContentStyle = {
  flex: 1,
};

const transactionTitleStyle = {
  color: '#1F2937',
  fontWeight: '600' as const,
  fontSize: 16,
  marginBottom: 4,
  letterSpacing: -0.2,
};

const transactionDescriptionStyle = {
  color: '#6B7280',
  fontSize: 14,
  marginBottom: 6,
  lineHeight: 18,
};

const transactionDateStyle = {
  color: '#9CA3AF',
  fontSize: 12,
  fontWeight: '500' as const,
};

const repaymentProgressStyle = {
  color: '#6B7280',
  fontSize: 11,
  fontWeight: '500' as const,
  marginTop: 2,
};

const transactionAmountContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

const transactionAmountStyle = {
  fontWeight: 'bold' as const,
  fontSize: 16,
  letterSpacing: -0.3,
};

// Paid transaction styles
const paidTransactionCardStyle = {
  backgroundColor: '#F9FAFB',
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  opacity: 0.8,
};

const paidTransactionIconContainerStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: '#10B98120',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: 12,
};

const paidTransactionTitleStyle = {
  color: '#9CA3AF',
  fontWeight: '500' as const,
  fontSize: 16,
  marginBottom: 4,
  textDecorationLine: 'line-through' as const,
  letterSpacing: -0.2,
};

const paidTransactionDescriptionStyle = {
  color: '#9CA3AF',
  fontSize: 14,
  marginBottom: 6,
  textDecorationLine: 'line-through' as const,
  lineHeight: 18,
};

const paidTransactionDateStyle = {
  color: '#9CA3AF',
  fontSize: 12,
  fontWeight: '500' as const,
  textDecorationLine: 'line-through' as const,
};

const paidBadgeStyle = {
  backgroundColor: '#10B981',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
  alignSelf: 'flex-start' as const,
};

const paidBadgeTextStyle = {
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: 'bold' as const,
  letterSpacing: 0.5,
};

export default DebtLoanScreen;
