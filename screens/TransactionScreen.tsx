import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DailyCard from '../components/DailyCard';
import {
  transactionService,
  walletService,
  type Transaction,
  type Wallet,
} from '../services/authService';

export default function TransactionScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM format for current month
  );
  const [selectedWallet, setSelectedWallet] = useState<string>('all'); // 'all' or walletId
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transactionService.getTransactions();
      // console.log('Loaded transactions:', JSON.stringify(response.data, null, 2));
      setTransactions(response.data);

      // Auto-select current month or most recent month with transactions
      if (response.data.length > 0) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const hasCurrentMonthTransactions = response.data.some(
          (t: Transaction) => new Date(t.date).toISOString().substring(0, 7) === currentMonth
        );

        if (!hasCurrentMonthTransactions) {
          // If no transactions this month, select the most recent month
          const mostRecentTransaction = response.data.reduce(
            (latest: Transaction, current: Transaction) =>
              new Date(current.date) > new Date(latest.date) ? current : latest
          );
          const mostRecentMonth = new Date(mostRecentTransaction.date)
            .toISOString()
            .substring(0, 7);
          setSelectedMonth(mostRecentMonth);
        }
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWallets = useCallback(async () => {
    try {
      const response = await walletService.getWallets();
      setWallets(response.data);
    } catch (error: any) {
      console.error('Error loading wallets:', error);
      // Non-blocking error since wallets are for filtering only
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadWallets();
  }, [loadTransactions, loadWallets]);

  // Refresh transactions when screen comes into focus (e.g., after adding a new transaction)
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadWallets();
    }, [loadTransactions, loadWallets])
  );
  const handleAddNewTransaction = () => {
    (navigation as any).navigate('AddTransactionScreen');
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach((transaction) => {
      const monthKey = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse(); // Most recent first
  };

  const formatMonthForDisplay = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getSelectedWalletName = () => {
    if (selectedWallet === 'all') return 'All Wallets';
    const wallet = wallets.find((w) => w._id === selectedWallet);
    return wallet ? wallet.name : 'All Wallets';
  };

  const getFilteredTransactions = () => {
    return transactions.filter((transaction) => {
      const transactionMonth = new Date(transaction.date).toISOString().substring(0, 7);
      const monthMatches = transactionMonth === selectedMonth;

      if (selectedWallet === 'all') {
        return monthMatches;
      }

      const walletMatches = transaction.walletId === selectedWallet;
      return monthMatches && walletMatches;
    });
  };

  const groupTransactionsByDate = () => {
    // Get filtered transactions for selected month
    const filteredTransactions = getFilteredTransactions();

    // First, sort filtered transactions by date (newest first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    // Group the sorted transactions by date
    const grouped = sortedTransactions.reduce(
      (acc, transaction) => {
        const dateKey = formatDateForDisplay(transaction.date);
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

        acc[dateKey].push(transaction);
        return acc;
      },
      {} as Record<string, Transaction[]>
    );

    // Return grouped data maintaining the sort order
    return Object.keys(grouped).map((date) => ({
      date,
      transactions: grouped[date],
    }));
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={modernBackgroundStyle}>
        {/* Header Section */}
        <View style={headerContainerStyle}>
          <View className="mb-6">
            <Text
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#1F2937',
                letterSpacing: -0.5,
                marginBottom: 2,
              }}>
              Transactions
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                letterSpacing: -0.1,
                marginBottom: 10,
              }}>
              Track your financial activities
            </Text>
          </View>

          {/* Filters Row */}
          <View style={filtersRowStyle}>
            {/* Month Selector */}
            <View style={filterItemStyle}>
              <TouchableOpacity
                style={monthSelectorStyle}
                onPress={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowWalletPicker(false); // Close wallet picker
                }}
                activeOpacity={0.8}>
                <View style={monthSelectorContentStyle}>
                  <Text style={monthSelectorTextStyle}>{formatMonthForDisplay(selectedMonth)}</Text>
                  <Text style={monthSelectorIconStyle}>{showMonthPicker ? '🔼' : '🔽'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Wallet Selector */}
            <View style={filterItemStyle}>
              <TouchableOpacity
                style={walletSelectorStyle}
                onPress={() => {
                  setShowWalletPicker(!showWalletPicker);
                  setShowMonthPicker(false); // Close month picker
                }}
                activeOpacity={0.8}>
                <View style={monthSelectorContentStyle}>
                  <Text style={walletSelectorTextStyle}>{getSelectedWalletName()}</Text>
                  <Text style={monthSelectorIconStyle}>{showWalletPicker ? '🔼' : '🔽'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Month Picker Dropdown */}
          {showMonthPicker && (
            <View style={monthPickerDropdownStyle}>
              <ScrollView style={monthPickerScrollStyle} nestedScrollEnabled>
                {getAvailableMonths().map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      monthPickerItemStyle,
                      selectedMonth === month && monthPickerItemActiveStyle,
                    ]}
                    onPress={() => {
                      setSelectedMonth(month);
                      setShowMonthPicker(false);
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        monthPickerItemTextStyle,
                        selectedMonth === month && monthPickerItemActiveTextStyle,
                      ]}>
                      {formatMonthForDisplay(month)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Wallet Picker Dropdown */}
          {showWalletPicker && (
            <View style={monthPickerDropdownStyle}>
              <ScrollView style={monthPickerScrollStyle} nestedScrollEnabled>
                <TouchableOpacity
                  style={[
                    monthPickerItemStyle,
                    selectedWallet === 'all' && monthPickerItemActiveStyle,
                  ]}
                  onPress={() => {
                    setSelectedWallet('all');
                    setShowWalletPicker(false);
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      monthPickerItemTextStyle,
                      selectedWallet === 'all' && monthPickerItemActiveTextStyle,
                    ]}>
                    All Wallets
                  </Text>
                </TouchableOpacity>
                {wallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet._id}
                    style={[
                      monthPickerItemStyle,
                      selectedWallet === wallet._id && monthPickerItemActiveStyle,
                    ]}
                    onPress={() => {
                      setSelectedWallet(wallet._id);
                      setShowWalletPicker(false);
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        monthPickerItemTextStyle,
                        selectedWallet === wallet._id && monthPickerItemActiveTextStyle,
                      ]}>
                      {wallet.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Transaction List */}
        <ScrollView
          style={scrollViewStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}>
          {loading ? (
            <View style={loadingContainerStyle}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={loadingTextStyle}>Loading transactions...</Text>
            </View>
          ) : getFilteredTransactions().length > 0 ? (
            <View style={mainContentStyle}>
              {/* <View style={sectionHeaderStyle}>
                <Text style={sectionTitleStyle}>{formatMonthForDisplay(selectedMonth)}</Text>
                <View style={sortIndicatorStyle}>
                  <Text style={sortTextStyle}>{getFilteredTransactions().length} transactions</Text>
                  <Text style={sortIconStyle}>📅</Text>
                </View>
              </View> */}
              {groupTransactionsByDate().map((dateGroup) => (
                <DailyCard
                  key={dateGroup.date}
                  date={dateGroup.date}
                  transactions={dateGroup.transactions}
                />
              ))}
            </View>
          ) : (
            <View style={emptyStateContainerStyle}>
              <View style={emptyStateCardStyle}>
                <Text style={emptyStateTitleStyle}>
                  {transactions.length === 0 ? 'No transactions yet' : 'No transactions found'}
                </Text>
                <Text style={emptyStateDescriptionStyle}>
                  {transactions.length === 0
                    ? 'Start tracking your finances by adding your first transaction'
                    : selectedWallet === 'all'
                      ? `No transactions found for ${formatMonthForDisplay(selectedMonth)}`
                      : `No transactions found for ${getSelectedWalletName()} in ${formatMonthForDisplay(selectedMonth)}`}
                </Text>
                <TouchableOpacity
                  style={emptyStateButtonStyle}
                  onPress={handleAddNewTransaction}
                  activeOpacity={0.8}>
                  <Text style={emptyStateButtonTextStyle}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          style={floatingButtonStyle}
          onPress={handleAddNewTransaction}
          activeOpacity={0.8}>
          <Text style={floatingButtonTextStyle}>+</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Modern Financial App Style Objects
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

const monthSelectorStyle = {
  backgroundColor: '#F8FAFC',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  marginTop: 8,
};

const monthSelectorContentStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingHorizontal: 16,
  paddingVertical: 8,
};

const monthSelectorTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#1F2937',
  letterSpacing: -0.2,
};

const monthSelectorIconStyle = {
  fontSize: 14,
  color: '#6B7280',
};

// Filter Styles
const filtersRowStyle = {
  flexDirection: 'row' as const,
  gap: 12,
  marginBottom: 1,
};

const filterItemStyle = {
  flex: 1,
};

const walletSelectorStyle = {
  backgroundColor: '#F1F5F9',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  marginTop: 8,
};

const walletSelectorTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#1F2937',
  letterSpacing: -0.2,
};

const monthPickerDropdownStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  marginTop: 8,
  maxHeight: 200,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 6,
};

const monthPickerScrollStyle = {
  maxHeight: 180,
};

const monthPickerItemStyle = {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
};

const monthPickerItemActiveStyle = {
  backgroundColor: '#EBF4FF',
  borderBottomColor: '#DBEAFE',
};

const monthPickerItemTextStyle = {
  fontSize: 14,
  fontWeight: '500' as const,
  color: '#374151',
};

const monthPickerItemActiveTextStyle = {
  color: '#3B82F6',
  fontWeight: '600' as const,
};

const scrollViewStyle = {
  flex: 1,
};

const scrollContentStyle = {
  flexGrow: 1,
  paddingHorizontal: 15,
  paddingVertical: 28,
  paddingBottom: 100, // Extra space for floating button
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

// const sectionHeaderStyle = {
//   flexDirection: 'row' as const,
//   alignItems: 'center' as const,
//   justifyContent: 'space-between' as const,
//   marginBottom: 24,
//   paddingHorizontal: 4,
// };

// const sectionTitleStyle = {
//   fontSize: 20,
//   fontWeight: 'bold' as const,
//   color: '#1F2937',
//   letterSpacing: -0.3,
// };

// const sortIndicatorStyle = {
//   flexDirection: 'row' as const,
//   alignItems: 'center' as const,
//   backgroundColor: '#F1F5F9',
//   paddingHorizontal: 12,
//   paddingVertical: 6,
//   borderRadius: 12,
// };

// const sortTextStyle = {
//   fontSize: 12,
//   color: '#6B7280',
//   fontWeight: '500' as const,
//   marginRight: 6,
// };

// const sortIconStyle = {
//   fontSize: 14,
//   color: '#9CA3AF',
// };

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
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 12,
  letterSpacing: -0.3,
};

const emptyStateDescriptionStyle = {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 24,
  marginBottom: 32,
  paddingHorizontal: 8,
};

const emptyStateButtonStyle = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 16,
  shadowColor: '#3B82F6',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

const emptyStateButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
  letterSpacing: -0.1,
};

const floatingButtonStyle = {
  position: 'absolute' as const,
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 32,
  backgroundColor: '#50c878',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  shadowColor: '#3B82F6',
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 10,
};

const floatingButtonTextStyle = {
  fontSize: 28,
  fontWeight: 'bold' as const,
  color: '#FFFFFF',
  lineHeight: 32,
};
