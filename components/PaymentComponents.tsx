import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { WebView } from 'react-native-webview';

interface RouteParams {
  amount: number;
  description?: string;
  walletId?: string;
}

interface PaymentRequest {
  amount: number;
  description: string;
  user_id: string;
}

export default function PaymentComponent() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, setUser } = useAuth();
  const { amount, description = 'Premium Upgrade' } = route.params as RouteParams;

  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    Alert.alert('Cancel Payment?', 'Are you sure you want to cancel the payment process?', [
      {
        text: 'Continue Payment',
        style: 'cancel',
      },
      {
        text: 'Cancel Payment',
        onPress: () => navigation.goBack(),
        style: 'destructive',
      },
    ]);
  }, [navigation]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(() => {
    Alert.alert(
      'Payment Successful!',
      'Congratulations! You are now a Premium user. You can now access AI recommendations and advanced features.',
      [
        {
          text: 'OK',
          onPress: () => {
            // TODO: Update user premium status in AuthContext
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation]);

  // Handle payment failed
  const handlePaymentFailed = useCallback(() => {
    Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.', [
      {
        text: 'Retry',
        onPress: () => {
          setRetryTrigger((prev) => prev + 1);
        },
      },
      {
        text: 'Cancel',
        onPress: () => navigation.goBack(),
        style: 'cancel',
      },
    ]);
  }, [navigation]);

  // Handle payment cancelled
  const handlePaymentCancelled = useCallback(() => {
    Alert.alert('Payment Cancelled', 'You have cancelled the payment process.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [navigation]);

  // Open payment in InAppBrowser
  const openPaymentBrowser = useCallback(
    async (url: string) => {
      try {
        console.log('Opening payment in InAppBrowser:', url);

        const result = await WebBrowser.openBrowserAsync(url, {
          // Presentation style
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,

          // Colors and appearance
          toolbarColor: '#3B82F6',
          controlsColor: '#FFFFFF',

          // Browser features
          enableBarCollapsing: false,
          showTitle: true,

          // Close button
          showInRecents: false,
        });

        console.log('InAppBrowser result:', result);

        // Handle the result
        if (result.type === 'cancel') {
          console.log('User cancelled payment');
          handlePaymentCancelled();
        } else if (result.type === 'dismiss') {
          console.log('Browser dismissed');
          // For expo-web-browser, we don't get the final URL
          // So we'll show a dialog asking user about payment status
          Alert.alert('Payment Status', 'Did you complete the payment successfully?', [
            {
              text: 'Yes, Paid Successfully',
              onPress: () => handlePaymentSuccess(),
            },
            {
              text: 'No, Payment Failed',
              onPress: () => handlePaymentFailed(),
            },
            {
              text: 'Cancelled',
              onPress: () => handlePaymentCancelled(),
              style: 'cancel',
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to open payment browser:', error);
        Alert.alert(
          'Browser Error',
          'Failed to open payment page. Would you like to try in your default browser?',
          [
            {
              text: 'Open in Browser',
              onPress: () => Linking.openURL(url),
            },
            {
              text: 'Cancel',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
          ]
        );
      } finally {
        setIsLoading(false);
      }
    },
    [navigation, handlePaymentSuccess, handlePaymentFailed, handlePaymentCancelled]
  );

  // Initialize payment
  const initializePayment = useCallback(async () => {
    try {
      setIsLoading(true);

      const paymentData: PaymentRequest = {
        amount: amount,
        description: description,
        user_id: user?._id || 'unknown_user', // Get user ID from AuthContext
      };

      console.log('Initializing payment with data:', paymentData);

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('https://finance-tracker-ecru-eight.vercel.app/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Payment response:', result);

      // Handle different response formats
      let redirectUrl = null;

      if (result.success && result.data && result.data.redirect_url) {
        redirectUrl = result.data.redirect_url;
      } else if (result.redirect_url) {
        redirectUrl = result.redirect_url;
      } else if (result.data && result.data.redirect_url) {
        redirectUrl = result.data.redirect_url;
      } else if (result.snap_redirect_url) {
        redirectUrl = result.snap_redirect_url;
      } else if (result.payment_url) {
        redirectUrl = result.payment_url;
      }

      if (redirectUrl) {
        setPaymentUrl(redirectUrl);
        console.log('Payment URL set:', redirectUrl);

        // Immediately open payment in InAppBrowser
        // openPaymentBrowser(redirectUrl);
      } else {
        console.error('No redirect URL found in response:', result);

        // For development/testing - show what we received
        Alert.alert(
          'Debug: Server Response',
          `Received response but no redirect URL found.\n\nResponse keys: ${Object.keys(result).join(', ')}\n\nFull response: ${JSON.stringify(result, null, 2).substring(0, 200)}...`,
          [
            {
              text: 'Use Test URL',
              onPress: () => {
                setIsLoading(false);
                const testUrl = 'https://simulator.sandbox.midtrans.com/v2/demo';
                setPaymentUrl(testUrl);
                openPaymentBrowser(testUrl);
              },
            },
            {
              text: 'Cancel',
              onPress: () => {
                setIsLoading(false);
                navigation.goBack();
              },
              style: 'cancel',
            },
          ]
        );
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // More specific error handling
      let errorMessage = 'Failed to initialize payment';
      if (error.name === 'AbortError') {
        errorMessage =
          'Payment request timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'Server error: ' + error.message;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('Payment gateway URL')) {
        errorMessage = 'Payment service is temporarily unavailable. Please try again later.';
      }

      Alert.alert('Payment Error', errorMessage, [
        {
          text: 'Retry',
          onPress: () => setRetryTrigger((prev) => prev + 1),
        },
        {
          text: 'Use Demo',
          onPress: () => {
            setIsLoading(false);
            const demoUrl = 'https://simulator.sandbox.midtrans.com/v2/demo';
            setPaymentUrl(demoUrl);
            openPaymentBrowser(demoUrl);
          },
        },
        {
          text: 'Cancel',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
      ]);
    }
  }, [amount, description, navigation, openPaymentBrowser, user?._id]);

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [handleBackPress])
  );

  React.useEffect(() => {
    initializePayment();
  }, [initializePayment, retryTrigger]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (paymentUrl === '')
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please wait...</Text>
      </View>
    );

  return (
    <View style={loadingContainerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity onPress={handleBackPress} style={backButtonStyle}>
        <Text style={backButtonTextStyle}>← Back</Text>
      </TouchableOpacity>
      <WebView
        onNavigationStateChange={(newNavState) => {
          const { url } = newNavState;

          console.log(url, '<<<<<<<');
          // if (!url) return;

          if (url.includes('status_code=200')) {
            setUser((el: any) => {
              el.isPremium = true;
              return el;
            });
            navigation.goBack();
          }
        }}
        source={{ uri: paymentUrl as string }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

// Styles
const containerStyle = {
  flex: 1,
  backgroundColor: '#FFFFFF',
};

const loadingContainerStyle = {
  flex: 1,
  backgroundColor: '#F9FAFB',
  paddingTop: 65,
};
const backButtonTextStyle = {
  fontSize: 16,
  fontWeight: '500' as const,
  color: '#374151',
};

const loadingTextStyle = {
  marginTop: 16,
  fontSize: 18,
  fontWeight: '600' as const,
  color: '#374151',
  textAlign: 'center' as const,
};

const loadingSubtextStyle = {
  marginTop: 8,
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center' as const,
};

const headerContainerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 100,
  paddingHorizontal: 20,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const backButtonStyle = {
  alignSelf: 'flex-start' as const,
  padding: 8,
  marginBottom: 12,
};

const headerContentStyle = {
  alignItems: 'center' as const,
};

const headerTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 4,
};

const headerAmountStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#3B82F6',
};

const headerDescriptionStyle = {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center' as const,
  marginTop: 4,
};

const securityBadgeStyle = {
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  marginTop: 8,
};

const securityBadgeTextStyle = {
  fontSize: 12,
  color: '#4B5563',
  fontWeight: '500' as const,
};

const contentContainerStyle = {
  flex: 1,
  padding: 20,
};

const paymentStatusContainerStyle = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const paymentStatusTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#111827',
  textAlign: 'center' as const,
  marginBottom: 16,
};

const paymentStatusTextStyle = {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 24,
  marginBottom: 32,
};

const actionButtonsContainerStyle = {
  width: '100%' as const,
  maxWidth: 300,
};

const primaryButtonStyle = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 8,
  marginBottom: 12,
};

const primaryButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
  textAlign: 'center' as const,
};

const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#D1D5DB',
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 8,
  marginBottom: 12,
};

const secondaryButtonTextStyle = {
  color: '#374151',
  fontSize: 16,
  fontWeight: '500' as const,
  textAlign: 'center' as const,
};

const cancelButtonStyle = {
  backgroundColor: '#6B7280',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
  marginTop: 24,
};

const cancelButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
  textAlign: 'center' as const,
};

const debugContainerStyle = {
  position: 'absolute' as const,
  bottom: 80,
  left: 10,
  right: 10,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  padding: 12,
  borderRadius: 8,
  maxHeight: 120,
};

const debugTextStyle = {
  color: '#FFFFFF',
  fontSize: 11,
  marginBottom: 4,
  fontFamily: 'monospace' as const,
};

const debugButtonStyle = {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  marginTop: 8,
};

const debugButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: '600' as const,
  textAlign: 'center' as const,
};
