import { categoryService, type Category, type Transaction } from '../services/authService';

/**
 * Utility function to ensure user has default categories initialized
 * This can be called from any screen to ensure categories exist
 */
export const ensureCategoriesExist = async (): Promise<Category[]> => {
  try {
    console.log('Checking if user has categories...');

    // First, try to get existing categories
    const categoriesResponse = await categoryService.getCategories();

    if (categoriesResponse.data.length === 0) {
      console.log('No categories found, initializing default categories...');

      // Initialize default categories
      const initResponse = await categoryService.initializeCategories();
      console.log(`Successfully initialized ${initResponse.data.length} categories`);

      return initResponse.data;
    } else {
      console.log(`Found ${categoriesResponse.data.length} existing categories`);
      return categoriesResponse.data;
    }
  } catch (error: any) {
    console.error('Error ensuring categories exist:', error);
    throw new Error(error.message || 'Failed to initialize categories');
  }
};

/**
 * Initialize categories if none exist, but don't throw error if it fails
 * Useful for background initialization
 */
export const initializeCategoriesIfNeeded = async (): Promise<void> => {
  try {
    await ensureCategoriesExist();
  } catch (error) {
    console.log('Categories initialization failed silently:', error);
    // Don't throw error, just log it
  }
};

/**
 * Format currency to IDR format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get the display amount with correct sign based on category type
 * Debt (borrowing) should show positive (increases wallet balance)
 * Loan (lending) should show negative (decreases wallet balance)
 * Repayment-debt (paying back debt) should show negative (decreases wallet balance)
 * Repayment-loan (receiving loan payment) should show positive (increases wallet balance)
 */
export const getDisplayAmount = (amount: number, categoryType: string): number => {
  switch (categoryType.toLowerCase()) {
    case 'income':
    case 'debt':
    case 'repayment-loan':
    case 'adjustmentpositive':
      // Income, debt (borrowing), repayment-loan (receiving payment), and positive adjustment increase wallet balance, show positive
      return Math.abs(amount);
    case 'expense':
    case 'loan':
    case 'repayment-debt':
    case 'adjustmentnegative':
      // Expense, loan (lending), repayment-debt (paying back), and negative adjustment decrease wallet balance, show negative
      return -Math.abs(amount);
    case 'transfer':
      // Transfer can be either positive or negative depending on context
      return amount;
    default:
      return amount;
  }
};

/**
 * Get amount color based on category type
 */
export const getAmountColor = (categoryType: string): string => {
  switch (categoryType.toLowerCase()) {
    case 'income':
    case 'debt':
    case 'repayment-loan':
    case 'adjustmentpositive':
      return '#10B981'; // Green for positive (income, debt/borrowing, repayment-loan, positive adjustment)
    case 'expense':
    case 'loan':
    case 'repayment-debt':
    case 'adjustmentnegative':
      return '#EF4444'; // Red for negative (expense, loan/lending, repayment-debt, negative adjustment)
    case 'transfer':
      return '#6B7280'; // Gray for transfer
    default:
      return '#6B7280';
  }
};

/**
 * Format currency with correct sign and color based on category type
 */
export const formatDisplayCurrency = (
  amount: number,
  categoryType: string
): {
  formattedAmount: string;
  color: string;
  displayAmount: number;
} => {
  const displayAmount = getDisplayAmount(amount, categoryType);
  const color = getAmountColor(categoryType);
  const formattedAmount = formatCurrency(displayAmount);

  return {
    formattedAmount,
    color,
    displayAmount,
  };
};

/**
 * Find a category by type from a list of categories
 */
export const findCategoryByType = (categories: Category[], type: string): Category | null => {
  return categories.find((category) => category.type === type) || null;
};

/**
 * Get the appropriate repayment category type based on the original transaction type
 */
export const getRepaymentCategoryType = (originalTransactionType: string): string => {
  switch (originalTransactionType.toLowerCase()) {
    case 'debt':
      return 'repayment-debt';
    case 'loan':
      return 'repayment-loan';
    default:
      throw new Error(`Invalid transaction type for repayment: ${originalTransactionType}`);
  }
};

/**
 * Find the appropriate repayment category ID for a given transaction type
 */
export const findRepaymentCategoryId = async (originalTransactionType: string): Promise<string> => {
  try {
    // Get all categories
    const categoriesResponse = await categoryService.getCategories();
    const categories = categoriesResponse.data;

    // Get the appropriate repayment category type
    const repaymentType = getRepaymentCategoryType(originalTransactionType);

    // Find the repayment category
    const repaymentCategory = findCategoryByType(categories, repaymentType);

    if (!repaymentCategory) {
      throw new Error(`Repayment category not found for type: ${repaymentType}`);
    }

    return repaymentCategory._id;
  } catch (error: any) {
    console.error('Error finding repayment category:', error);
    throw new Error(error.message || 'Failed to find repayment category');
  }
};

/**
 * Calculate the remaining amount for a debt or loan transaction after repayments
 */
export const calculateRemainingAmount = (transaction: Transaction): number => {
  console.log('calculateRemainingAmount - Transaction:', {
    id: transaction._id,
    amount: transaction.amount,
    repayments: transaction.repayments,
  });

  if (!transaction.repayments || transaction.repayments.length === 0) {
    console.log(
      'calculateRemainingAmount - No repayments found, returning original amount:',
      transaction.amount
    );
    return transaction.amount;
  }

  // Repayments come as negative amounts from the API, so we need to get their absolute values
  const totalRepayments = transaction.repayments.reduce((total, repayment) => {
    const absAmount = Math.abs(repayment.amount);
    console.log('calculateRemainingAmount - Processing repayment:', {
      originalAmount: repayment.amount,
      absAmount: absAmount,
    });
    return total + absAmount;
  }, 0);

  const remaining = Math.max(0, transaction.amount - totalRepayments);
  console.log('calculateRemainingAmount - Final calculation:', {
    originalAmount: transaction.amount,
    totalRepayments: totalRepayments,
    remaining: remaining,
  });

  return remaining;
};

/**
 * Check if a debt or loan transaction is fully paid
 */
export const isTransactionFullyPaid = (transaction: Transaction): boolean => {
  return calculateRemainingAmount(transaction) === 0;
};

/**
 * Get the total amount of repayments for a transaction
 */
export const getTotalRepayments = (transaction: Transaction): number => {
  console.log('getTotalRepayments - Transaction repayments:', transaction.repayments);

  if (!transaction.repayments || transaction.repayments.length === 0) {
    console.log('getTotalRepayments - No repayments found, returning 0');
    return 0;
  }

  // Repayments come as negative amounts from the API, so we need to get their absolute values
  const total = transaction.repayments.reduce((total, repayment) => {
    const absAmount = Math.abs(repayment.amount);
    console.log('getTotalRepayments - Processing repayment:', {
      originalAmount: repayment.amount,
      absAmount: absAmount,
    });
    return total + absAmount;
  }, 0);

  console.log('getTotalRepayments - Total repayments:', total);
  return total;
};
