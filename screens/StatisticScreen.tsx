import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { G, Path } from 'react-native-svg';
import {
  transactionService,
  categoryService,
  type Transaction,
  type Category,
} from '../services/authService';

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  categoryType:
    | 'income'
    | 'expense'
    | 'debt'
    | 'loan'
    | 'transfer'
    | 'repayment-debt'
    | 'repayment-loan'
    | 'adjustmentNegative'
    | 'adjustmentPositive';
  totalAmount: number;
  transactionCount: number;
  color: string;
  percentage: number;
}

export default function StatisticScreen() {
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM format for current month
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Helper functions for month selection
  const getAvailableMonths = () => {
    const months = new Set<string>();
    allTransactions.forEach((transaction) => {
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

  const calculateMonthlyStats = useCallback(
    (transactions: Transaction[], categories: Category[], month: string) => {
      const filteredTransactions = transactions.filter((transaction) => {
        const transactionMonth = new Date(transaction.date).toISOString().substring(0, 7);
        return transactionMonth === month;
      });
      calculateCategoryStats(filteredTransactions, categories);
    },
    []
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [transactionsResponse, categoriesResponse] = await Promise.all([
        transactionService.getTransactions(),
        categoryService.getCategories(),
      ]);

      setAllTransactions(transactionsResponse.data);
      setAllCategories(categoriesResponse.data);

      // Auto-select current month or most recent month with transactions
      if (transactionsResponse.data.length > 0) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const hasCurrentMonthTransactions = transactionsResponse.data.some(
          (t: Transaction) => new Date(t.date).toISOString().substring(0, 7) === currentMonth
        );

        if (!hasCurrentMonthTransactions) {
          // If no transactions this month, select the most recent month
          const mostRecentTransaction = transactionsResponse.data.reduce(
            (latest: Transaction, current: Transaction) =>
              new Date(current.date) > new Date(latest.date) ? current : latest
          );
          const mostRecentMonth = new Date(mostRecentTransaction.date)
            .toISOString()
            .substring(0, 7);
          setSelectedMonth(mostRecentMonth);
        }
      }

      // Calculate stats for the selected month
      calculateMonthlyStats(transactionsResponse.data, categoriesResponse.data, selectedMonth);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, calculateMonthlyStats]);

  // Use useFocusEffect to reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Effect to recalculate stats when selectedMonth changes
  React.useEffect(() => {
    if (allTransactions.length > 0 && allCategories.length > 0) {
      calculateMonthlyStats(allTransactions, allCategories, selectedMonth);
    }
  }, [selectedMonth, allTransactions, allCategories, calculateMonthlyStats]);

  const calculateCategoryStats = (transactions: Transaction[], categories: Category[]) => {
    const statsMap = new Map<string, CategoryStat>();
    const colorPalette = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#E74C3C',
      '#2ECC71',
      '#F39C12',
      '#8E44AD',
    ];

    // Initialize stats for each category
    categories.forEach((category, index) => {
      statsMap.set(category._id, {
        categoryId: category._id,
        categoryName: category.name,
        categoryType: category.type,
        totalAmount: 0,
        transactionCount: 0,
        color: colorPalette[index % colorPalette.length],
        percentage: 0,
      });
    });

    // Calculate totals from transactions
    transactions.forEach((transaction) => {
      const stat = statsMap.get(transaction.categoryId);
      if (stat) {
        stat.totalAmount += Math.abs(transaction.amount);
        stat.transactionCount += 1;
      }
    });

    // Filter categories with transactions and calculate percentages
    const stats = Array.from(statsMap.values()).filter((stat) => stat.transactionCount > 0);
    const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);

    stats.forEach((stat) => {
      stat.percentage = totalAmount > 0 ? (stat.totalAmount / totalAmount) * 100 : 0;
    });

    // Sort by total amount descending
    stats.sort((a, b) => b.totalAmount - a.totalAmount);
    setCategoryStats(stats);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return '#10B981';
      case 'expense':
        return '#EF4444';
      case 'debt':
        return '#F59E0B';
      case 'loan':
        return '#EF4444';
      case 'repayment-debt':
        return '#EF4444';
      case 'repayment-loan':
        return '#10B981';
      case 'adjustmentNegative':
        return '#EF4444';
      case 'adjustmentPositive':
        return '#10B981';
      case 'transfer':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  // SVG Pie Chart component
  const PieChart = ({ data }: { data: CategoryStat[] }) => {
    const size = 200;
    const radius = 80;
    const center = size / 2;

    let cumulativePercentage = 0;

    const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
      const start = polarToCartesian(center, center, radius, endAngle);
      const end = polarToCartesian(center, center, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      return [
        'M',
        center,
        center,
        'L',
        start.x,
        start.y,
        'A',
        radius,
        radius,
        0,
        largeArcFlag,
        0,
        end.x,
        end.y,
        'Z',
      ].join(' ');
    };

    const polarToCartesian = (
      centerX: number,
      centerY: number,
      radius: number,
      angleInDegrees: number
    ) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    return (
      <View style={{ alignItems: 'center', marginVertical: 2 }}>
        <Svg width={size} height={size}>
          {data.map((item) => {
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
            const pathData = createArcPath(startAngle, endAngle, radius);
            cumulativePercentage += item.percentage;

            return (
              <G key={item.categoryId}>
                <Path d={pathData} fill={item.color} stroke="#ffffff" strokeWidth="2" />
              </G>
            );
          })}
        </Svg>
        {/* <Text
          style={{
            fontSize: 14,
            color: '#6B7280',
            marginTop: 10,
            textAlign: 'center',
          }}>
          Transaction Distribution by Category
        </Text> */}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text
          style={{
            marginTop: 16,
            color: '#6B7280',
            fontSize: 16,
            fontWeight: '500',
          }}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: 60,
          paddingHorizontal: 24,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#1F2937',
            letterSpacing: -0.5,
            marginBottom: 8,
          }}>
          Transaction Statistics
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#6B7280',
            letterSpacing: -0.1,
            marginBottom: 16,
          }}>
          Overview of your spending by category
        </Text>

        {/* Month Selector */}
        <TouchableOpacity
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginTop: 2,
          }}
          onPress={() => setShowMonthPicker(!showMonthPicker)}
          activeOpacity={0.8}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                letterSpacing: -0.2,
              }}>
              {formatMonthForDisplay(selectedMonth)}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
              }}>
              {showMonthPicker ? '🔼' : '🔽'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Month Picker Dropdown */}
        {showMonthPicker && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              marginTop: 8,
              maxHeight: 200,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {getAvailableMonths().map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    {
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F3F4F6',
                    },
                    selectedMonth === month && {
                      backgroundColor: '#EBF4FF',
                      borderBottomColor: '#DBEAFE',
                    },
                  ]}
                  onPress={() => {
                    setSelectedMonth(month);
                    setShowMonthPicker(false);
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      {
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#374151',
                      },
                      selectedMonth === month && {
                        color: '#3B82F6',
                        fontWeight: '600',
                      },
                    ]}>
                    {formatMonthForDisplay(month)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Pie Chart Section */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          margin: 20,
          borderRadius: 24,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1F2937',
            marginBottom: 1,
            letterSpacing: -0.3,
          }}>
          Category Distribution - {formatMonthForDisplay(selectedMonth)}
        </Text>

        {categoryStats.length > 0 ? (
          <PieChart data={categoryStats} />
        ) : (
          <View
            style={{
              height: 220,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 16,
                fontWeight: '500',
              }}>
              No transaction data available for {formatMonthForDisplay(selectedMonth)}
            </Text>
          </View>
        )}
      </View>

      {/* Category List Section */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 20,
          marginBottom: 20,
          borderRadius: 24,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}>
        {/* <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1F2937',
            marginBottom: 16,
            letterSpacing: -0.3,
          }}>
          Category Breakdown
        </Text> */}

        {categoryStats.map((stat, index) => (
          <View
            key={stat.categoryId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              borderBottomWidth: index < categoryStats.length - 1 ? 1 : 0,
              borderBottomColor: '#F3F4F6',
            }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: stat.color,
                  marginRight: 16,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: 4,
                    letterSpacing: -0.2,
                  }}>
                  {stat.categoryName}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: `${getTypeColor(stat.categoryType)}20`,
                    }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: getTypeColor(stat.categoryType),
                        textTransform: 'capitalize',
                      }}>
                      {stat.categoryType}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#9CA3AF',
                      fontWeight: '500',
                    }}>
                    {stat.transactionCount} transaction{stat.transactionCount > 1 ? 's' : ''} •{' '}
                    {stat.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: getTypeColor(stat.categoryType),
                letterSpacing: -0.2,
              }}>
              {formatAmount(stat.totalAmount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
