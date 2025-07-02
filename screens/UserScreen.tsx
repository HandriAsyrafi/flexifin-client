import * as React from 'react';
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

export default function UserScreen() {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Premium features include AI recommendations, advanced analytics, and priority support.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Learn More',
          onPress: () => {
            // Navigate to premium features page or external link
            Alert.alert('Coming Soon', 'Premium upgrade will be available soon!');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: confirmLogout,
      },
    ]);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout API
      await api.post('/api/users/logout');

      // Use auth context to logout (this will automatically navigate to login)
      logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={containerStyle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={headerTopStyle}>
            <View>
              <Text style={titleStyle}>Profile</Text>
              {user ? (
                <View>
                  <Text style={subtitleStyle}>Welcome back, {user.name}!</Text>
                  <View style={usernamePremiumContainerStyle}>
                    <Text style={usernameStyle}>@{user.username}</Text>
                    {user.isPremium && (
                      <View style={premiumBadgeStyle}>
                        <Icon name="star" size={12} color="#FFFFFF" />
                        <Text style={premiumBadgeTextStyle}>Premium</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={subtitleStyle}>Manage your account settings</Text>
              )}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={contentStyle}>
          {/* User Info Card */}
          {user && (
            <View style={userInfoCardStyle}>
              <Text style={cardTitleStyle}>Account Information</Text>
              <View style={infoRowStyle}>
                <Text style={labelStyle}>Full Name:</Text>
                <Text style={valueStyle}>{user.name}</Text>
              </View>
              <View style={infoRowStyle}>
                <Text style={labelStyle}>Username:</Text>
                <Text style={valueStyle}>@{user.username}</Text>
              </View>
              <View style={infoRowStyle}>
                <Text style={labelStyle}>Email:</Text>
                <Text style={valueStyle}>{user.email}</Text>
              </View>
              <View style={[infoRowStyle, { borderBottomWidth: 0 }]}>
                <Text style={labelStyle}>Account Type:</Text>
                <View style={accountTypeContainerStyle}>
                  {user.isPremium ? (
                    <View style={premiumStatusStyle}>
                      <Icon name="star" size={16} color="#F59E0B" />
                      <Text style={premiumTextStyle}>Premium</Text>
                    </View>
                  ) : (
                    <Text style={freeTextStyle}>Free</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Premium Status Card */}
          {user && (
            <View style={premiumCardStyle}>
              {user.isPremium ? (
                <View>
                  <Text style={premiumDescriptionStyle}>
                    You have access to all premium features including AI recommendations and
                    advanced analytics.
                  </Text>
                  <View style={premiumFeaturesStyle}>
                    <View style={featureItemStyle}>
                      <Icon name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={featureTextStyle}>AI Financial Recommendations</Text>
                    </View>
                    <View style={featureItemStyle}>
                      <Icon name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={featureTextStyle}>Advanced Analytics</Text>
                    </View>
                    <View style={featureItemStyle}>
                      <Icon name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={featureTextStyle}>Priority Support</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={upgradeHeaderStyle}>
                    <Icon name="star-outline" size={24} color="#6B7280" />
                    <Text style={upgradeCardTitleStyle}>Upgrade to Premium</Text>
                  </View>
                  <Text style={upgradeDescriptionStyle}>
                    Unlock AI-powered financial insights and advanced features to better manage your
                    money.
                  </Text>
                  <TouchableOpacity style={upgradeButtonStyle} onPress={handleUpgrade}>
                    <Icon name="arrow-up" size={16} color="#FFFFFF" />
                    <Text style={upgradeButtonTextStyle}>Upgrade Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Logout Button */}
          <View style={{ marginTop: 'auto' }}>
            <TouchableOpacity
              style={[logoutButtonStyle, isLoggingOut && disabledButtonStyle]}
              onPress={handleLogout}
              disabled={isLoggingOut}>
              {isLoggingOut ? (
                <View style={buttonContentStyle}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={logoutButtonTextStyle}>Logging out...</Text>
                </View>
              ) : (
                <Text style={logoutButtonTextStyle}>Logout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// Style objects
const containerStyle = {
  flex: 1,
  backgroundColor: '#F8FAFC',
};

const headerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 20,
  paddingHorizontal: 24,
  paddingBottom: 24,
  borderBottomLeftRadius: 28,
  borderBottomRightRadius: 28,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  letterSpacing: -0.5,
  marginBottom: 8,
};

const subtitleStyle = {
  fontSize: 16,
  color: '#6B7280',
  letterSpacing: -0.1,
};

const usernameStyle = {
  fontSize: 14,
  color: '#3B82F6',
  letterSpacing: -0.1,
  fontWeight: '500' as const,
  marginTop: 6,
};

const contentStyle = {
  flex: 1,
  padding: 20,
};

const userInfoCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

const cardTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  marginBottom: 16,
  letterSpacing: -0.2,
};

const infoRowStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
};

const labelStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const valueStyle = {
  fontSize: 14,
  color: '#1F2937',
  fontWeight: '600' as const,
  flex: 1,
  textAlign: 'right' as const,
};

const logoutButtonStyle = {
  backgroundColor: '#EF4444',
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 16,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: '#EF4444',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
  width: '100%',
};

const disabledButtonStyle = {
  backgroundColor: '#9CA3AF',
  shadowOpacity: 0,
  elevation: 0,
};

const logoutButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
  letterSpacing: -0.1,
};

const buttonContentStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

// New styles for premium features
const headerTopStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'flex-start' as const,
};

const usernamePremiumContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

const premiumBadgeStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: '#F59E0B',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  gap: 4,
};

const premiumBadgeTextStyle = {
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
};

const accountTypeContainerStyle = {
  alignItems: 'flex-end' as const,
};

const premiumStatusStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
};

const premiumTextStyle = {
  fontSize: 14,
  color: '#F59E0B',
  fontWeight: '600' as const,
};

const freeTextStyle = {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '600' as const,
};

const premiumCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

const premiumHeaderStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  marginBottom: 12,
};

const premiumCardTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  letterSpacing: -0.2,
};

const premiumDescriptionStyle = {
  fontSize: 14,
  color: '#6B7280',
  lineHeight: 20,
  marginBottom: 16,
};

const premiumFeaturesStyle = {
  gap: 8,
};

const featureItemStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

const featureTextStyle = {
  fontSize: 14,
  color: '#374151',
  fontWeight: '500' as const,
};

const upgradeHeaderStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  marginBottom: 12,
};

const upgradeCardTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#1F2937',
  letterSpacing: -0.2,
};

const upgradeDescriptionStyle = {
  fontSize: 14,
  color: '#6B7280',
  lineHeight: 20,
  marginBottom: 16,
};

const upgradeButtonStyle = {
  backgroundColor: '#3B82F6',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 12,
  gap: 6,
  shadowColor: '#3B82F6',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

const upgradeButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600' as const,
};
