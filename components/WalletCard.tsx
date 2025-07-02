import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface WalletCardProps {
  id: string;
  name: string;
  balance: number;
  targetAmount: number | null;
  currentAmount: number | null;
  status: string;
  onPress: (id: string) => void;
}

export default function WalletCard({
  id,
  name,
  balance,
  targetAmount,
  status,
  onPress,
}: WalletCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'in Progress':
        return '#F59E0B'; // amber
      case 'normal':
        return '#10B981'; // green
      case 'completed':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
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

  // Calculate progress percentage for target amount
  const getProgressPercentage = () => {
    if (!targetAmount || targetAmount <= 0) return 0;
    const percentage = (balance / targetAmount) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Determine if wallet has a savings goal
  const hasTarget = targetAmount && targetAmount > 0;

  // Get progress bar color based on progress
  const getProgressColor = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return '#10B981'; // green - completed
    if (progress >= 75) return '#3B82F6'; // blue - almost there
    if (progress >= 50) return '#8B5CF6'; // purple - halfway
    if (progress >= 25) return '#F59E0B'; // amber - getting started
    return '#EF4444'; // red - just started
  };

  // Get progress bar background color for subtle gradient effect
  const getProgressBackgroundColor = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return '#DCFCE7'; // light green
    if (progress >= 75) return '#DBEAFE'; // light blue
    if (progress >= 50) return '#EDE9FE'; // light purple
    if (progress >= 25) return '#FEF3C7'; // light amber
    return '#FEE2E2'; // light red
  };

  return (
    <TouchableOpacity style={cardContainerStyle} onPress={() => onPress(id)} activeOpacity={0.7}>
      <View style={cardStyle}>
        {/* Status Indicator */}
        <View style={[statusIndicatorStyle, { backgroundColor: getStatusColor() }]} />

        {/* Main Content Row */}
        <View style={contentRowStyle}>
          {/* Left Side - Wallet Info */}
          <View style={leftContentStyle}>
            {/* Wallet Name */}
            <Text style={walletNameStyle} numberOfLines={1}>
              {name}
            </Text>

            {/* Balance */}
            <Text style={balanceLabelStyle}>{hasTarget ? 'Current Balance' : 'Balance'}</Text>
            <Text style={balanceAmountStyle}>{formatAmount(balance)}</Text>

            {/* Status */}
            {/* <View style={statusRowStyle}>
              <View style={[statusDotStyle, { backgroundColor: getStatusColor() }]} />
              <Text style={[statusTextStyle, { color: getStatusColor() }]}>{status}</Text>
            </View> */}
          </View>

          {/* Right Side - Target Info (if exists) */}
          {hasTarget && (
            <View style={rightContentStyle}>
              {/* Target Amount */}
              <Text style={targetLabelStyle}>Target</Text>
              <Text style={targetAmountStyle}>{formatAmount(targetAmount!)}</Text>

              {/* Progress Bar Container */}
              <View
                style={[
                  progressBarContainerStyle,
                  { backgroundColor: getProgressBackgroundColor() },
                ]}>
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

              {/* Progress Text */}
              <Text style={[progressPercentageStyle, { color: getProgressColor() }]}>
                {getProgressPercentage().toFixed(1)}%
              </Text>

              {/* Amount Remaining or Achievement */}
              {getProgressPercentage() >= 100 ? (
                <Text style={achievementTextStyle}>🎉 Achieved!</Text>
              ) : (
                <Text style={remainingAmountStyle} numberOfLines={1}>
                  {formatAmount(targetAmount! - balance)} to go
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Modern Style Objects
const cardContainerStyle = {
  marginBottom: 16,
  width: '100%' as const,
};

const cardStyle = {
  position: 'relative' as const,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#F3F4F6',
  backgroundColor: '#FFFFFF',
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const statusIndicatorStyle = {
  position: 'absolute' as const,
  right: 16,
  top: 16,
  width: 12,
  height: 12,
  borderRadius: 6,
};

const contentRowStyle = {
  flexDirection: 'row' as const,
};

const leftContentStyle = {
  flex: 1,
  paddingRight: 16,
};

const walletNameStyle = {
  fontSize: 18,
  fontWeight: '600' as const,
  textTransform: 'capitalize' as const,
  color: '#111827',
  marginBottom: 8,
};

const balanceLabelStyle = {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 4,
};

const balanceAmountStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 8,
};

const statusRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const statusDotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  marginRight: 8,
};

const statusTextStyle = {
  fontSize: 14,
  fontWeight: '500' as const,
  textTransform: 'capitalize' as const,
};

const rightContentStyle = {
  width: 160,
};

const targetLabelStyle = {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 4,
};

const targetAmountStyle = {
  fontSize: 18,
  fontWeight: '600' as const,
  color: '#374151',
  marginBottom: 12,
};

const progressBarContainerStyle = {
  height: 12,
  width: '100%' as const,
  borderRadius: 6,
  overflow: 'hidden' as const,
  marginBottom: 8,
};

const progressBarFillStyle = {
  height: '100%' as const,
  borderRadius: 6,
  minWidth: '3%' as const,
};

const progressPercentageStyle = {
  fontSize: 14,
  fontWeight: '500' as const,
  marginBottom: 4,
};

const achievementTextStyle = {
  fontSize: 14,
  fontWeight: '500' as const,
  color: '#059669',
};

const remainingAmountStyle = {
  fontSize: 12,
  color: '#6B7280',
};
