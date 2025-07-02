import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const { height } = Dimensions.get('window');

export default function PremiumUpgradeModal({
  visible,
  onClose,
  onUpgrade,
}: PremiumUpgradeModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={overlayStyle}>
        <View style={modalContainerStyle}>
          <ScrollView
            contentContainerStyle={scrollContentStyle}
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={headerStyle}>
              <View style={premiumIconContainerStyle}>
                <Text style={premiumIconStyle}>👑</Text>
              </View>
              <Text style={titleStyle}>Upgrade to Premium</Text>
              <Text style={subtitleStyle}>
                Unlock AI-powered financial insights and advanced features
              </Text>
            </View>

            {/* Premium Features */}
            <View style={featuresContainerStyle}>
              <Text style={featuresSectionTitleStyle}>Premium Features:</Text>

              <View style={featureItemStyle}>
                <Text style={featureIconStyle}>🤖</Text>
                <View style={featureTextContainerStyle}>
                  <Text style={featureTitleStyle}>AI Recommendations</Text>
                  <Text style={featureDescriptionStyle}>
                    Get personalized financial advice and spending insights
                  </Text>
                </View>
              </View>

              <View style={featureItemStyle}>
                <Text style={featureIconStyle}>📊</Text>
                <View style={featureTextContainerStyle}>
                  <Text style={featureTitleStyle}>Advanced Analytics</Text>
                  <Text style={featureDescriptionStyle}>
                    Detailed spending patterns and financial forecasting
                  </Text>
                </View>
              </View>

              <View style={featureItemStyle}>
                <Text style={featureIconStyle}>🎯</Text>
                <View style={featureTextContainerStyle}>
                  <Text style={featureTitleStyle}>Smart Goal Tracking</Text>
                  <Text style={featureDescriptionStyle}>
                    Enhanced savings goals with AI-powered milestones
                  </Text>
                </View>
              </View>

              <View style={featureItemStyle}>
                <Text style={featureIconStyle}>🔒</Text>
                <View style={featureTextContainerStyle}>
                  <Text style={featureTitleStyle}>Priority Support</Text>
                  <Text style={featureDescriptionStyle}>
                    24/7 premium customer support and feature requests
                  </Text>
                </View>
              </View>
            </View>

            {/* Pricing */}
            <View style={pricingContainerStyle}>
              <View style={priceBoxStyle}>
                <Text style={originalPriceStyle}>Rp 150,000</Text>
                <Text style={discountPriceStyle}>Rp 100,000</Text>
                <Text style={discountBadgeStyle}>33% OFF</Text>
              </View>
              <Text style={pricingDescriptionStyle}>
                One-time payment • Lifetime access • No recurring fees
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={buttonsContainerStyle}>
              <TouchableOpacity style={upgradeButtonStyle} onPress={onUpgrade} activeOpacity={0.8}>
                <Text style={upgradeButtonTextStyle}>Upgrade to Premium</Text>
                <Text style={upgradeButtonSubtextStyle}>Rp 100,000</Text>
              </TouchableOpacity>

              <TouchableOpacity style={cancelButtonStyle} onPress={onClose} activeOpacity={0.7}>
                <Text style={cancelButtonTextStyle}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Styles
const overlayStyle = {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end' as const,
};

const modalContainerStyle = {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  maxHeight: height * 0.85,
  paddingBottom: 20,
};

const scrollContentStyle = {
  paddingHorizontal: 24,
  paddingTop: 20,
};

const headerStyle = {
  alignItems: 'center' as const,
  marginBottom: 32,
};

const premiumIconContainerStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#FEF3C7',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: 16,
};

const premiumIconStyle = {
  fontSize: 40,
};

const titleStyle = {
  fontSize: 28,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 8,
  textAlign: 'center' as const,
};

const subtitleStyle = {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 24,
  paddingHorizontal: 20,
};

const featuresContainerStyle = {
  marginBottom: 32,
};

const featuresSectionTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 20,
};

const featureItemStyle = {
  flexDirection: 'row' as const,
  alignItems: 'flex-start' as const,
  marginBottom: 20,
};

const featureIconStyle = {
  fontSize: 24,
  marginRight: 16,
  marginTop: 2,
};

const featureTextContainerStyle = {
  flex: 1,
};

const featureTitleStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#111827',
  marginBottom: 4,
};

const featureDescriptionStyle = {
  fontSize: 14,
  color: '#6B7280',
  lineHeight: 20,
};

const pricingContainerStyle = {
  alignItems: 'center' as const,
  marginBottom: 32,
  backgroundColor: '#F9FAFB',
  borderRadius: 16,
  padding: 20,
};

const priceBoxStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  marginBottom: 8,
};

const originalPriceStyle = {
  fontSize: 18,
  color: '#9CA3AF',
  textDecorationLine: 'line-through' as const,
  marginRight: 12,
};

const discountPriceStyle = {
  fontSize: 28,
  fontWeight: 'bold' as const,
  color: '#059669',
  marginRight: 12,
};

const discountBadgeStyle = {
  backgroundColor: '#DC2626',
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 'bold' as const,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
};

const pricingDescriptionStyle = {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center' as const,
};

const buttonsContainerStyle = {
  gap: 12,
};

const upgradeButtonStyle = {
  backgroundColor: '#3B82F6',
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 24,
  alignItems: 'center' as const,
  shadowColor: '#3B82F6',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

const upgradeButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: 'bold' as const,
  marginBottom: 2,
};

const upgradeButtonSubtextStyle = {
  color: '#E5E7EB',
  fontSize: 14,
  fontWeight: '500' as const,
};

const cancelButtonStyle = {
  backgroundColor: 'transparent',
  borderRadius: 16,
  paddingVertical: 14,
  paddingHorizontal: 24,
  alignItems: 'center' as const,
};

const cancelButtonTextStyle = {
  color: '#6B7280',
  fontSize: 16,
  fontWeight: '500' as const,
};
