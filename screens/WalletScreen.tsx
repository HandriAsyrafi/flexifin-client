import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import WalletCard from '../components/WalletCard';
import AIRecommendationModal from '../components/AIRecommendationModal';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { walletService, type Wallet } from '../services/authService';
import { initializeCategoriesIfNeeded } from '../utils/categoryHelper';
import { useAuth } from '../contexts/AuthContext';

export default function WalletScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await walletService.getWallets();
      console.log('Loaded wallets:', response.data); // Debug log to see wallet data structure
      setWallets(response.data);

      // Also ensure categories are initialized for new users
      await initializeCategoriesIfNeeded();
    } catch (error: any) {
      console.error('Error loading wallets:', error);
      Alert.alert('Error', error.message || 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  // Refresh wallets when screen comes into focus (e.g., after adding a new wallet)
  useFocusEffect(
    useCallback(() => {
      loadWallets();
    }, [loadWallets])
  );

  const handleWalletPress = (walletId: string) => {
    // Navigate to wallet detail screen
    (navigation as any).navigate('WalletDetailScreen', { walletId });
  };

  const handleAddWallet = () => {
    // Navigate to add wallet screen
    (navigation as any).navigate('AddWalletScreen');
  };

  const handleUpgradeToPremium = () => {
    // Navigate to payment screen
    (navigation as any).navigate('PaymentScreen', {
      amount: 100000, // Rp 100,000 for premium upgrade
      description: 'Premium Upgrade - AI Recommendations & Advanced Features',
    });
  };

  const handleAIButtonClick = () => {
    // Check if user is premium
    if (user?.isPremium) {
      // User is premium, show AI modal
      setShowAIModal(true);
    } else {
      // User is not premium, show upgrade modal
      setShowUpgradeModal(true);
    }
  };

  const handleUpgradeFromModal = () => {
    setShowUpgradeModal(false);
    handleUpgradeToPremium();
  };

  const renderWalletItem = ({ item }: { item: Wallet }) => (
    <WalletCard
      id={item._id}
      name={item.name}
      balance={item.balance}
      targetAmount={item.targetAmount || null}
      currentAmount={item.currentAmount || null}
      status={item.status}
      onPress={handleWalletPress}
    />
  );

  const renderEmptyState = () => (
    <View style={emptyStateContainerStyle}>
      <View style={emptyStateIconContainerStyle}>
        <Text style={emptyStateIconStyle}>💳</Text>
      </View>
      <Text style={emptyStateTitleStyle}>No Wallets Found</Text>
      <Text style={emptyStateDescriptionStyle}>
        Create your first wallet to start managing your finances and tracking your savings goals
      </Text>
      <TouchableOpacity style={emptyStateButtonStyle} onPress={handleAddWallet}>
        <Text style={emptyStateButtonTextStyle}>Add Your First Wallet</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={mainContainerStyle}>
        {/* Header */}
        <View style={headerContainerStyle}>
          <View style={headerContentStyle}>
            <View>
              <Text style={headerTitleStyle}>My Wallets</Text>
              <Text style={headerSubtitleStyle}>Manage your savings and goals</Text>
            </View>
            <View style={headerButtonsContainerStyle}>
              {/* Premium Status/Upgrade Button */}
              {user?.isPremium ? (
                <View style={premiumActiveButtonStyle}>
                  <Text style={premiumActiveIconStyle}>👑</Text>
                  <Text style={premiumActiveTextStyle}>Premium</Text>
                </View>
              ) : (
                <TouchableOpacity style={premiumButtonStyle} onPress={handleUpgradeToPremium}>
                  <Text style={premiumButtonIconStyle}>👑</Text>
                  <Text style={premiumButtonTextStyle}>Upgrade</Text>
                </TouchableOpacity>
              )}
              {/* AI Recommendation Button */}
              <TouchableOpacity style={aiButtonStyle} onPress={handleAIButtonClick}>
                <Text style={aiButtonTextStyle}>🤖 AI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Wallets List */}
        <FlatList
          data={wallets}
          renderItem={renderWalletItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          refreshing={loading}
          onRefresh={loadWallets}
        />

        {/* Floating Add Button */}
        <TouchableOpacity style={floatingButtonStyle} onPress={handleAddWallet}>
          <Text style={floatingButtonTextStyle}>+</Text>
        </TouchableOpacity>

        {/* AI Recommendation Modal */}
        <AIRecommendationModal visible={showAIModal} onClose={() => setShowAIModal(false)} />

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgradeFromModal}
        />
      </View>
    </>
  );
}

// Modern Style Objects
const mainContainerStyle = {
  flex: 1,
  backgroundColor: '#F9FAFB',
};

const headerContainerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 20,
  paddingHorizontal: 20,
  paddingBottom: 22,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const headerContentStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
};

const headerTitleStyle = {
  fontSize: 26,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 4,
  letterSpacing: -0.5,
};

const headerSubtitleStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const emptyStateContainerStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 32,
  paddingVertical: 80,
};

const emptyStateIconContainerStyle = {
  width: 96,
  height: 96,
  borderRadius: 48,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginBottom: 32,
};

const emptyStateIconStyle = {
  fontSize: 36,
};

const emptyStateTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#111827',
  textAlign: 'center' as const,
  marginBottom: 12,
};

const emptyStateDescriptionStyle = {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 24,
  marginBottom: 32,
};

const emptyStateButtonStyle = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 16,
  shadowColor: '#3B82F6',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
};

const emptyStateButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const listContentStyle = {
  padding: 16,
  paddingBottom: 100,
};

const floatingButtonStyle = {
  position: 'absolute' as const,
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 32,
  backgroundColor: '#FF5B00',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  shadowColor: '#3B82F6',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 10,
};

const floatingButtonTextStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#FFFFFF',
};

// Add these new styles
const aiButtonStyle = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  shadowColor: '#3B82F6',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 2,
  minWidth: 55,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const aiButtonTextStyle = {
  fontSize: 11,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const headerButtonsContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

const premiumButtonStyle = {
  backgroundColor: '#F59E0B',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  shadowColor: '#F59E0B',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 2,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  minWidth: 75,
  justifyContent: 'center' as const,
};

const premiumButtonIconStyle = {
  fontSize: 10,
  color: '#FFFFFF',
};

const premiumButtonTextStyle = {
  fontSize: 11,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const premiumActiveButtonStyle = {
  backgroundColor: '#059669',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  minWidth: 75,
  justifyContent: 'center' as const,
  borderWidth: 1,
  borderColor: '#34D399',
};

const premiumActiveIconStyle = {
  fontSize: 10,
  color: '#FFFFFF',
};

const premiumActiveTextStyle = {
  fontSize: 11,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};
