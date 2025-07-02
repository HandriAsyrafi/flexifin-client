import * as React from 'react';
import { useEffect } from 'react';
import { View, Text, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Show welcome screen for 2 seconds then navigate
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'HomeNavigator' }],
        });
      } else {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#50C878" />
      <View style={containerStyle}>
        {/* Logo Container */}
        <View style={logoContainerStyle}>
          {/* App Logo - Wallet Icon */}
          <Image
            source={require('../assets/flexifin.png')} // Replace with your logo path
            style={{ width: 120, height: 120, borderRadius: 20, marginBottom: 24 }}
            resizeMode="contain"
          />
          {/* <View style={logoCircleStyle}>
            <Icon name="wallet-outline" size={56} color="#ffffff" />
          </View> */}

          {/* App Name */}
          {/* <Text style={appNameStyle}>FlexiFin</Text> */}
          <Text style={taglineStyle}>Finance Made Flexible</Text>
        </View>

        {/* Loading Indicator */}
        <View style={loadingContainerStyle}>
          <View style={loadingDotStyle} />
          <View style={loadingDotStyle} />
          <View style={loadingDotStyle} />
        </View>

        {/* Footer */}
        <View style={footerStyle}>
          <Text style={footerTextStyle}>Welcome to your financial journey</Text>
        </View>
      </View>
    </>
  );
}

// Style objects - Monochrome theme
const containerStyle = {
  flex: 1,
  backgroundColor: '#50C878',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  paddingHorizontal: 20,
};

const logoContainerStyle = {
  alignItems: 'center' as const,
  marginBottom: 60,
};

// const logoCircleStyle = {
//   width: 120,
//   height: 120,
//   borderRadius: 20,
//   backgroundColor: '#50C878',
//   justifyContent: 'center' as const,
//   alignItems: 'center' as const,
//   marginBottom: 24,
//   shadowColor: '#FFFFFF',
//   shadowOffset: { width: 0, height: 8 },
//   shadowOpacity: 0.3,
//   shadowRadius: 20,
//   elevation: 12,
//   borderWidth: 2,
//   borderColor: '#FFFFFF',
// };

// const appNameStyle = {
//   fontSize: 32,
//   fontWeight: 'bold' as const,
//   color: '#ffffff',
//   letterSpacing: -0.5,
//   marginBottom: 8,
//   textAlign: 'center' as const,
// };

const taglineStyle = {
  fontSize: 16,
  color: '#ffffff',
  textAlign: 'center' as const,
  letterSpacing: -0.1,
  fontWeight: '500' as const,
};

const loadingContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  marginBottom: 80,
};

const loadingDotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#FFFFFF',
  opacity: 0.8,
};

const footerStyle = {
  position: 'absolute' as const,
  bottom: 40,
  alignItems: 'center' as const,
};

const footerTextStyle = {
  fontSize: 14,
  color: '#ffffff',
  fontWeight: '500' as const,
  letterSpacing: -0.1,
};
