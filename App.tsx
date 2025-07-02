import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, ActivityIndicator } from 'react-native';
import LoginScreen from 'screens/LoginScreen';
import AddTransactionScreen from 'screens/AddTransactionScreen';
import AddWalletScreen from 'screens/AddWalletScreen';
import WalletDetailScreen from 'screens/WalletDetailScreen';
import TransactionDetailScreen from 'screens/TransactionDetailScreen';
import DebtLoanDetailScreen from 'screens/DebtLoanDetailScreen';
import WelcomeScreen from 'screens/WelcomeScreen';
import './global.css';
import HomeNavigator from 'navigators/HomeNavigators';
import RegisterScreen from 'screens/RegisterScreen';
import { AuthProvider, useAuth } from 'contexts/AuthContext';
import { useSessionManager } from 'contexts/useSessionManager';
import PaymentComponent from 'components/PaymentComponents';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Gunakan session manager untuk auto-validation
  useSessionManager();

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Welcome Screen - Always shown first */}
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />

        {!isAuthenticated ? (
          // Auth Stack - for non-authenticated users
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack - for authenticated users
          <>
            <Stack.Screen name="HomeNavigator" component={HomeNavigator} />
            <Stack.Screen name="AddTransactionScreen" component={AddTransactionScreen} />
            <Stack.Screen name="AddWalletScreen" component={AddWalletScreen} />
            <Stack.Screen name="WalletDetailScreen" component={WalletDetailScreen} />
            <Stack.Screen name="TransactionDetailScreen" component={TransactionDetailScreen} />
            <Stack.Screen name="DebtLoanDetailScreen" component={DebtLoanDetailScreen} />
            <Stack.Screen
              name="PaymentScreen"
              component={PaymentComponent}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
