import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { categoryService, type Category, type Transaction } from '../services/authService';

interface DailyCardProps {
  date: string;
  transactions: Transaction[];
}

export default function DailyCard({ date, transactions }: DailyCardProps) {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find((cat) => cat._id === categoryId);
  };
  const getTransactionTypeColor = (
    transactionType:
      | 'income'
      | 'expense'
      | 'debt'
      | 'loan'
      | 'transfer'
      | 'repayment-debt'
      | 'repayment-loan'
      | 'adjustmentNegative'
      | 'adjustmentPositive'
  ) => {
    switch (transactionType) {
      case 'income':
        return '#10B981'; // green
      case 'expense':
        return '#EF4444'; // red
      case 'debt':
        return '#10B981'; // green (debt/borrowing increases balance)
      case 'loan':
        return '#EF4444'; // red (loan/lending decreases balance)
      case 'repayment-debt':
        return '#EF4444'; // red (paying back debt decreases balance)
      case 'repayment-loan':
        return '#10B981'; // green (receiving loan repayment increases balance)
      case 'adjustmentNegative':
        return '#EF4444'; // red (negative adjustment decreases balance)
      case 'adjustmentPositive':
        return '#10B981'; // green (positive adjustment increases balance)
      case 'transfer':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
    }
  };
  const getAmountDisplay = (
    transactionType:
      | 'income'
      | 'expense'
      | 'debt'
      | 'loan'
      | 'transfer'
      | 'repayment-debt'
      | 'repayment-loan'
      | 'adjustmentNegative'
      | 'adjustmentPositive',
    amount: number
  ) => {
    // debt (borrowing), income, adjustmentPositive show positive, expense, loan (lending), adjustmentNegative show negative
    // repayment-debt (paying back) shows negative, repayment-loan (receiving payment) shows positive
    const prefix =
      transactionType === 'expense' ||
      transactionType === 'loan' ||
      transactionType === 'repayment-debt' ||
      transactionType === 'adjustmentNegative'
        ? '-'
        : '+';
    return `${prefix}Rp ${Math.abs(amount).toLocaleString('id-ID')}`;
  };
  const getDailyTotal = () => {
    return transactions.reduce((total, transaction) => {
      const category = getCategoryById(transaction.categoryId);
      const transactionType = category?.type || 'expense';
      if (
        transactionType === 'income' ||
        transactionType === 'debt' ||
        transactionType === 'repayment-loan' ||
        transactionType === 'adjustmentPositive'
      ) {
        // Income, debt (borrowing), repayment-loan (receiving payment), and positive adjustment increase balance
        return total + transaction.amount;
      } else if (
        transactionType === 'expense' ||
        transactionType === 'loan' ||
        transactionType === 'repayment-debt' ||
        transactionType === 'adjustmentNegative'
      ) {
        // Expense, loan (lending), repayment-debt (paying back), and negative adjustment decrease balance
        return total - transaction.amount;
      }
      return total;
    }, 0);
  };
  const getTransactionIcon = (
    transactionType:
      | 'income'
      | 'expense'
      | 'debt'
      | 'loan'
      | 'transfer'
      | 'repayment-debt'
      | 'repayment-loan'
      | 'adjustmentNegative'
      | 'adjustmentPositive',
    categoryName?: string
  ) => {
    const iconSize = 22;
    const iconColor = getTransactionTypeColor(transactionType);

    // Category-specific icons
    if (categoryName) {
      const categoryLower = categoryName.toLowerCase();

      // Food & Dining
      if (
        categoryLower.includes('food') ||
        categoryLower.includes('restaurant') ||
        categoryLower.includes('dining') ||
        categoryLower.includes('meal') ||
        categoryLower.includes('makan') ||
        categoryLower.includes('makanan')
      ) {
        return <Icon name="restaurant" size={iconSize} color={iconColor} />;
      }

      // Transportation
      if (
        categoryLower.includes('transport') ||
        categoryLower.includes('gas') ||
        categoryLower.includes('fuel') ||
        categoryLower.includes('car') ||
        categoryLower.includes('taxi') ||
        categoryLower.includes('bus') ||
        categoryLower.includes('ojek') ||
        categoryLower.includes('bensin')
      ) {
        return <Icon name="car" size={iconSize} color={iconColor} />;
      }

      // Shopping & Retail
      if (
        categoryLower.includes('shopping') ||
        categoryLower.includes('clothes') ||
        categoryLower.includes('fashion') ||
        categoryLower.includes('retail') ||
        categoryLower.includes('belanja') ||
        categoryLower.includes('baju')
      ) {
        return <Icon name="bag" size={iconSize} color={iconColor} />;
      }

      // Health & Medical
      if (
        categoryLower.includes('health') ||
        categoryLower.includes('medical') ||
        categoryLower.includes('doctor') ||
        categoryLower.includes('hospital') ||
        categoryLower.includes('medicine') ||
        categoryLower.includes('kesehatan') ||
        categoryLower.includes('dokter') ||
        categoryLower.includes('obat')
      ) {
        return <Icon name="medical" size={iconSize} color={iconColor} />;
      }

      // Entertainment
      if (
        categoryLower.includes('entertainment') ||
        categoryLower.includes('movie') ||
        categoryLower.includes('game') ||
        categoryLower.includes('fun') ||
        categoryLower.includes('hiburan') ||
        categoryLower.includes('cinema') ||
        categoryLower.includes('musik') ||
        categoryLower.includes('streaming')
      ) {
        return <Icon name="game-controller" size={iconSize} color={iconColor} />;
      }

      // Education
      if (
        categoryLower.includes('education') ||
        categoryLower.includes('school') ||
        categoryLower.includes('course') ||
        categoryLower.includes('book') ||
        categoryLower.includes('pendidikan') ||
        categoryLower.includes('sekolah') ||
        categoryLower.includes('kuliah') ||
        categoryLower.includes('kursus')
      ) {
        return <Icon name="school" size={iconSize} color={iconColor} />;
      }

      // Utilities & Bills
      if (
        categoryLower.includes('utility') ||
        categoryLower.includes('electric') ||
        categoryLower.includes('water') ||
        categoryLower.includes('internet') ||
        categoryLower.includes('phone') ||
        categoryLower.includes('bill') ||
        categoryLower.includes('listrik') ||
        categoryLower.includes('air') ||
        categoryLower.includes('telepon') ||
        categoryLower.includes('wifi')
      ) {
        return <Icon name="receipt" size={iconSize} color={iconColor} />;
      }

      // Home & Housing
      if (
        categoryLower.includes('home') ||
        categoryLower.includes('rent') ||
        categoryLower.includes('house') ||
        categoryLower.includes('furniture') ||
        categoryLower.includes('rumah') ||
        categoryLower.includes('sewa') ||
        categoryLower.includes('kost') ||
        categoryLower.includes('furniture')
      ) {
        return <Icon name="home" size={iconSize} color={iconColor} />;
      }

      // Travel & Vacation
      if (
        categoryLower.includes('travel') ||
        categoryLower.includes('vacation') ||
        categoryLower.includes('holiday') ||
        categoryLower.includes('hotel') ||
        categoryLower.includes('liburan') ||
        categoryLower.includes('wisata') ||
        categoryLower.includes('jalan-jalan')
      ) {
        return <Icon name="airplane" size={iconSize} color={iconColor} />;
      }

      // Salary & Income
      if (
        categoryLower.includes('salary') ||
        categoryLower.includes('wage') ||
        categoryLower.includes('bonus') ||
        categoryLower.includes('income') ||
        categoryLower.includes('gaji') ||
        categoryLower.includes('penghasilan')
      ) {
        return <Icon name="briefcase" size={iconSize} color={iconColor} />;
      }

      // Investment & Finance
      if (
        categoryLower.includes('investment') ||
        categoryLower.includes('stock') ||
        categoryLower.includes('saving') ||
        categoryLower.includes('bank') ||
        categoryLower.includes('investasi') ||
        categoryLower.includes('saham') ||
        categoryLower.includes('tabungan')
      ) {
        return <Icon name="trending-up" size={iconSize} color={iconColor} />;
      }

      // Gift & Donation
      if (
        categoryLower.includes('gift') ||
        categoryLower.includes('donation') ||
        categoryLower.includes('charity') ||
        categoryLower.includes('hadiah') ||
        categoryLower.includes('donasi') ||
        categoryLower.includes('sedekah')
      ) {
        return <Icon name="gift" size={iconSize} color={iconColor} />;
      }
    } // Default icons by transaction type
    switch (transactionType) {
      case 'income':
        return <Icon name="trending-up" size={iconSize} color={iconColor} />;
      case 'expense':
        return <Icon name="trending-down" size={iconSize} color={iconColor} />;
      case 'debt':
        return <Icon name="add-circle" size={iconSize} color={iconColor} />; // debt/borrowing adds to balance
      case 'loan':
        return <Icon name="remove-circle" size={iconSize} color={iconColor} />; // loan/lending removes from balance
      case 'repayment-debt':
        return <Icon name="arrow-down-circle" size={iconSize} color={iconColor} />; // repaying debt removes from balance
      case 'repayment-loan':
        return <Icon name="arrow-up-circle" size={iconSize} color={iconColor} />; // receiving loan repayment adds to balance
      case 'adjustmentNegative':
        return <Icon name="remove" size={iconSize} color={iconColor} />; // negative adjustment removes from balance
      case 'adjustmentPositive':
        return <Icon name="add" size={iconSize} color={iconColor} />; // positive adjustment adds to balance
      case 'transfer':
        return <Icon name="swap-horizontal" size={iconSize} color={iconColor} />;
      default:
        return <Icon name="cash" size={iconSize} color={iconColor} />;
    }
  };

  const handleTransactionPress = (transactionId: string) => {
    (navigation as any).navigate('TransactionDetailScreen', { transactionId });
  };

  // Modern Financial App Style Objects for DailyCard
  const modernCardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  };

  const cardHeaderStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  };

  const dateInfoStyle = {
    flex: 1,
  };

  const dateTextStyle = {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1F2937',
    letterSpacing: -0.3,
  };

  const transactionCountStyle = {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  };

  const dailyTotalContainerStyle = {
    alignItems: 'flex-end' as const,
  };

  const dailyTotalLabelStyle = {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  };

  const dailyTotalAmountStyle = {
    fontSize: 22,
    fontWeight: 'bold' as const,
    letterSpacing: -0.3,
  };

  const transactionListStyle = {
    gap: 8,
  };

  const transactionItemStyle = {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  };

  const transactionRowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  };

  const transactionInfoContainerStyle = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };

  const iconContainerStyle = {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  };

  const transactionDetailsStyle = {
    flex: 1,
  };

  const categoryNameStyle = {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    letterSpacing: -0.2,
  };

  const walletContainerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 2,
  };

  const walletNameStyle = {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  };

  const descriptionStyle = {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400' as const,
  };

  const categoryIndicatorStyle = {
    marginTop: 6,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };

  const categoryDotStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  };

  const categoryTypeTextStyle = {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
    letterSpacing: -0.1,
  };

  const amountContainerStyle = {
    alignItems: 'flex-end' as const,
  };

  const amountTextStyle = {
    fontSize: 18,
    fontWeight: 'bold' as const,
    letterSpacing: -0.2,
  };

  return (
    <View style={modernCardStyle}>
      {/* Top Section - Date and Daily Total */}
      <View style={cardHeaderStyle}>
        <View style={dateInfoStyle}>
          <Text style={dateTextStyle}>{date}</Text>
          <Text style={transactionCountStyle}>
            {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={dailyTotalContainerStyle}>
          <Text style={dailyTotalLabelStyle}>Daily Total</Text>
          <Text
            style={[
              dailyTotalAmountStyle,
              {
                color: getDailyTotal() >= 0 ? '#10B981' : '#EF4444',
              },
            ]}>
            {getDailyTotal() >= 0 ? '+' : '-'}Rp {Math.abs(getDailyTotal()).toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <View style={transactionListStyle}>
        {transactions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((transaction, index) => {
            const category = getCategoryById(transaction.categoryId);
            let transactionType = category?.type || 'expense';
            let categoryName = category?.name || 'Unknown Category';

            // Handle repayment transactions with fallback
            if (categoryName === 'Unknown Category') {
              if (transaction.description?.includes('Repayment for')) {
                // This is a repayment transaction - default to debt repayment
                // In future, we could look up the original transaction to determine if it's debt or loan
                transactionType = 'repayment-debt';
                categoryName = 'Debt Repayment';
              } else if (transaction.parentId) {
                // This might be a repayment transaction
                transactionType = 'repayment-debt';
                categoryName = 'Debt Repayment';
              }
            }

            return (
              <TouchableOpacity
                key={transaction._id}
                style={[transactionItemStyle, index > 0 && { marginTop: 12 }]}
                onPress={() => handleTransactionPress(transaction._id)}
                activeOpacity={0.7}>
                <View style={transactionRowStyle}>
                  <View style={transactionInfoContainerStyle}>
                    {/* Icon Container */}
                    <View
                      style={[
                        iconContainerStyle,
                        {
                          backgroundColor: `${getTransactionTypeColor(transactionType)}20`,
                        },
                      ]}>
                      {getTransactionIcon(transactionType, categoryName)}
                    </View>

                    {/* Transaction Info */}
                    <View style={transactionDetailsStyle}>
                      <Text style={categoryNameStyle}>{categoryName}</Text>
                      {transaction.wallet && (
                        <View style={walletContainerStyle}>
                          <Icon name="wallet-outline" size={14} color="#6B7280" />
                          <Text style={walletNameStyle}>{transaction.wallet.name}</Text>
                        </View>
                      )}
                      {transaction.description && (
                        <Text style={descriptionStyle}>{transaction.description}</Text>
                      )}
                      <View style={categoryIndicatorStyle}>
                        <View
                          style={[
                            categoryDotStyle,
                            {
                              backgroundColor: getTransactionTypeColor(transactionType),
                            },
                          ]}
                        />
                        <Text
                          style={[
                            categoryTypeTextStyle,
                            { color: getTransactionTypeColor(transactionType) },
                          ]}>
                          {transactionType}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Amount */}
                  <View style={amountContainerStyle}>
                    <Text
                      style={[
                        amountTextStyle,
                        { color: getTransactionTypeColor(transactionType) },
                      ]}>
                      {getAmountDisplay(transactionType, transaction.amount)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}
