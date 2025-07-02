import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URL untuk server
// Untuk emulator Android gunakan 10.0.2.2, untuk iOS simulator gunakan localhost
const BASE_URL = 'https://finance-tracker-ecru-eight.vercel.app';

// Buat instance axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Untuk mengirim cookies
});

// Token key untuk SecureStore
const TOKEN_KEY = 'auth_token';

api.interceptors.request.use(
  async (config) => {
    // Otomatis tambahkan token dari SecureStore jika ada
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from SecureStore:', error);
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle expired atau invalid token
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear token dari SecureStore
      try {
        await tokenService.clearInvalidToken();
      } catch (clearError) {
        console.error('Error clearing invalid token:', clearError);
      }
    }

    return Promise.reject(error);
  }
);

// Types untuk authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    isPremium?: boolean;
  };
}

export interface RegisterResponse {
  message: string;
}

// Types untuk wallet
export interface Wallet {
  _id: string;
  name: string;
  balance: number;
  targetAmount?: number | null;
  currentAmount?: number | null;
  targetDate?: string | null;
  status: 'in Progress' | 'completed' | 'normal';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletData {
  name: string;
  balance: number;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  status: 'in Progress' | 'completed' | 'normal';
}

export interface WalletResponse {
  message: string;
  data: Wallet[];
}

export interface CreateWalletResponse {
  message: string;
  data: Wallet;
}

// Types untuk transaction
export interface Transaction {
  _id: string;
  userId: string;
  walletId: string;
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  parentId?: string; // For repayment transactions
  wallet?: {
    _id: string;
    name: string;
    balance: number;
  };
  category?: {
    _id: string;
    name: string;
    type:
      | 'income'
      | 'expense'
      | 'debt'
      | 'loan'
      | 'transfer'
      | 'repayment-debt'
      | 'repayment-loan'
      | 'adjustmentNegative'
      | 'adjustmentPositive';
  };
  repayments?: {
    _id: string;
    userId: string;
    walletId: string;
    categoryId: string;
    amount: number;
    description?: string;
    date: string;
    parentId: string;
    createdAt: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  walletId: string;
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  parentId?: string; // For repayment transactions
}

export interface TransactionResponse {
  message: string;
  data: Transaction[];
}

export interface CreateTransactionResponse {
  message: string;
  data: Transaction;
}

export interface Category {
  _id: string;
  name: string;
  type:
    | 'income'
    | 'expense'
    | 'debt'
    | 'loan'
    | 'transfer'
    | 'repayment-debt'
    | 'repayment-loan'
    | 'adjustmentNegative'
    | 'adjustmentPositive';
  userId: string;
  isDeletable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  message: string;
  data: Category[];
}

// Types untuk AI analysis =================================
export interface Root {
  success: boolean;
  data: Data;
  generatedAt: string;
}

export interface Data {
  aiRecommendations: AiRecommendation[];
  customAnalysis: CustomAnalysis;
  summary: Summary;
}

export interface AiRecommendation {
  actionSteps: string[];
  category: string;
  estimatedImpact: string;
  priority: string;
  recommendation: string;
}

export interface CustomAnalysis {
  riskLevel: string;
  budgetHealth: number;
  savingsRate: number;
  insights: string[];
}

export interface Summary {
  currentFinancialHealth: string;
  topPriorities: string[];
  nextActions: string[];
}

// ========================================================

// Token validation dan utility functions
export const tokenService = {
  // Fungsi untuk memeriksa apakah token masih valid
  isTokenValid: async (): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return false;

      // Test token dengan request sederhana ke endpoint yang memerlukan auth
      const response = await api.get('/api/wallets');
      return response.status === 200;
    } catch (error: any) {
      console.error('Token validation failed:', error);
      // Jika 401 atau 403, token tidak valid
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      // Untuk error lain, anggap token masih valid
      return true;
    }
  },

  // Fungsi untuk mendapatkan token dari SecureStore
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Fungsi untuk clear token jika tidak valid
  clearInvalidToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync('user_data');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  },
};

// Auth Service untuk Login dan Register
export const authService = {
  // Login function
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post('/api/users/login', credentials);

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register function
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
      const response = await api.post('/api/users/register', userData);

      // Pastikan response memiliki status success
      if (response.status === 201 && response.data) {
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error object:', error);

      // Handle network errors
      if (!error.response) {
        throw new Error('Network error - Cannot connect to server');
      }

      // Handle different error response formats
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Registration failed';

      throw new Error(errorMessage);
    }
  },
};

// Wallet Service
export const walletService = {
  // Get all wallets untuk user yang sedang login
  getWallets: async (): Promise<WalletResponse> => {
    try {
      const response = await api.get('/api/wallets');
      return response.data;
    } catch (error: any) {
      console.error('Get wallets error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to fetch wallets');
    }
  },

  // Get wallet by ID
  getWalletById: async (walletId: string): Promise<{ message: string; data: Wallet }> => {
    try {
      const response = await api.get(`/api/wallets/${walletId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get wallet by ID error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to fetch wallet');
    }
  },

  // Update wallet
  updateWallet: async (
    walletId: string,
    walletData: Partial<CreateWalletData>
  ): Promise<{ message: string; data: Wallet }> => {
    try {
      const response = await api.put(`/api/wallets/${walletId}`, walletData);
      return response.data;
    } catch (error: any) {
      console.error('Update wallet error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to update wallet');
    }
  },

  // Delete wallet
  deleteWallet: async (walletId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/api/wallets/${walletId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete wallet error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to delete wallet');
    }
  },

  // Create new wallet
  createWallet: async (walletData: CreateWalletData): Promise<CreateWalletResponse> => {
    try {
      const response = await api.post('/api/wallets', walletData);
      return response.data;
    } catch (error: any) {
      console.error('Create wallet error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to create wallet');
    }
  },
};

// Transaction Service
export const transactionService = {
  // Get all transactions untuk user yang sedang login
  getTransactions: async (): Promise<TransactionResponse> => {
    try {
      const response = await api.get('/api/transactions');
      return response.data;
    } catch (error: any) {
      console.error('Get transactions error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
    }
  },

  // Get transaction by ID
  getTransactionById: async (
    transactionId: string
  ): Promise<{ message: string; data: Transaction }> => {
    try {
      const response = await api.get(`/api/transactions/${transactionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transaction');
    }
  },

  // Update transaction
  updateTransaction: async (
    transactionId: string,
    transactionData: CreateTransactionData
  ): Promise<{ message: string; data: Transaction }> => {
    try {
      const response = await api.put(`/api/transactions/${transactionId}`, transactionData);
      return response.data;
    } catch (error: any) {
      console.error('Update transaction error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to update transaction');
    }
  },

  // Delete transaction
  deleteTransaction: async (transactionId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/api/transactions/${transactionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete transaction error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to delete transaction');
    }
  },

  // Create new transaction
  createTransaction: async (
    transactionData: CreateTransactionData
  ): Promise<CreateTransactionResponse> => {
    try {
      const response = await api.post('/api/transactions', transactionData);
      return response.data;
    } catch (error: any) {
      console.error('Create transaction error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to create transaction');
    }
  },

  // Get debt transactions
  getDebtTransactions: async (): Promise<TransactionResponse> => {
    try {
      const response = await api.get('/api/transactions/debt');
      return response.data;
    } catch (error: any) {
      console.error('Get debt transactions error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to fetch debt transactions');
    }
  },

  // Get loan transactions
  getLoanTransactions: async (): Promise<TransactionResponse> => {
    try {
      const response = await api.get('/api/transactions/loan');
      return response.data;
    } catch (error: any) {
      console.error('Get loan transactions error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to fetch loan transactions');
    }
  },
  // Repayment transaction (create new transaction with parentId)
  repayTransaction: async (
    transactionId: string,
    repaymentData: {
      walletId: string;
      categoryId: string;
      amount: number;
      date: string;
    }
  ): Promise<{ message: string; data: Transaction }> => {
    try {
      // Create new repayment transaction with parentId
      const newTransactionData: CreateTransactionData = {
        walletId: repaymentData.walletId,
        categoryId: repaymentData.categoryId,
        amount: repaymentData.amount,
        description: `Repayment for ${transactionId.slice(-8)}`,
        date: repaymentData.date,
        parentId: transactionId, // Link to original debt/loan transaction
      };

      const response = await api.post(`/api/transactions/${transactionId}`, newTransactionData);
      return response.data;
    } catch (error: any) {
      console.error('Repayment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Provide more detailed error information
      let errorMessage = 'Failed to process repayment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid repayment data. Please check all required fields.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Transaction not found.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      throw new Error(errorMessage);
    }
  },
};

// Category Service
export const categoryService = {
  // Get all categories untuk user yang sedang login
  getCategories: async (): Promise<CategoryResponse> => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Create new category
  createCategory: async (categoryData: {
    name: string;
    type: string;
  }): Promise<{ message: string; data: Category }> => {
    try {
      const response = await api.post('/api/categories', categoryData);
      return response.data;
    } catch (error: any) {
      console.error('Create category error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  },

  // Delete category
  deleteCategory: async (categoryId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/api/categories/${categoryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete category error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  },

  // Initialize default categories for a new user
  initializeCategories: async (): Promise<CategoryResponse> => {
    try {
      const response = await api.post('/api/categories/init');
      return response.data;
    } catch (error: any) {
      console.error('Initialize categories error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to initialize categories');
    }
  },
};

// AI Service for Premium Features
export const aiService = {
  getRecommendations: async (): Promise<Root> => {
    try {
      const response = await api.get('/api/premium', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Increase timeout to 15 seconds
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 405) {
        try {
          const postResponse = await api.post(
            '/api/premium',
            {},
            {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              timeout: 15000,
            }
          );
          return postResponse.data;
        } catch (postError: any) {
          throw new Error('AI recommendations service is temporarily unavailable');
        }
      } else if (error.response?.status === 401) {
        throw new Error('Please login to access AI recommendations');
      } else if (error.response?.status === 403) {
        throw new Error('AI recommendations require premium access');
      } else if (error.response?.status === 404) {
        throw new Error('AI recommendations service not found');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please check your internet connection');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error - please check your internet connection');
      }

      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch AI recommendations'
      );
    }
  },
};

export default api;
