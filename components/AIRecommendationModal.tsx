import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { aiService, type Root, type AiRecommendation } from '../services/authService';

interface AIRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function AIRecommendationModal({ visible, onClose }: AIRecommendationModalProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Root | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Starting AI recommendations fetch...');
      const data = await aiService.getRecommendations();
      console.log('Received AI data:', JSON.stringify(data, null, 2));

      // Handle different response structures
      if (data && typeof data === 'object') {
        setRecommendations(data);
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (error: any) {
      console.error('AI recommendations error:', error);
      const errorMessage = error.message || 'Failed to fetch AI recommendations';
      setError(errorMessage);

      // Don't show alert immediately, let user see the error in the modal
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = () => {
    fetchRecommendations();
  };

  const handleClose = () => {
    setRecommendations(null);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    fetchRecommendations();
  };

  // Safe access helper functions
  const safeGetValue = (obj: any, path: string, defaultValue: any = 'N/A') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const renderRecommendation = (recommendation: any, index: number) => (
    <View key={index} style={recommendationCardStyle}>
      <View style={recommendationHeaderStyle}>
        <Text style={recommendationCategoryStyle}>
          {safeGetValue(recommendation, 'category', 'General')}
        </Text>
        <View
          style={[
            priorityBadgeStyle,
            {
              backgroundColor: getPriorityColor(safeGetValue(recommendation, 'priority', 'medium')),
            },
          ]}>
          <Text style={priorityBadgeTextStyle}>
            {safeGetValue(recommendation, 'priority', 'Medium')}
          </Text>
        </View>
      </View>

      <Text style={recommendationTitleStyle}>
        {safeGetValue(recommendation, 'recommendation', 'No recommendation available')}
      </Text>

      <View style={impactContainerStyle}>
        <Text style={impactLabelStyle}>Estimated Impact:</Text>
        <Text style={impactValueStyle}>
          {safeGetValue(recommendation, 'estimatedImpact', 'Not specified')}
        </Text>
      </View>

      {Array.isArray(recommendation?.actionSteps) && recommendation.actionSteps.length > 0 && (
        <View style={actionStepsContainerStyle}>
          <Text style={actionStepsLabelStyle}>Action Steps:</Text>
          {recommendation.actionSteps.map((step: string, stepIndex: number) => (
            <View key={stepIndex} style={actionStepStyle}>
              <Text style={stepNumberStyle}>{stepIndex + 1}</Text>
              <Text style={stepTextStyle}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSimpleRecommendations = () => {
    if (!recommendations) return null;

    // Handle different response structures
    const aiRecommendations =
      safeGetValue(recommendations, 'data.aiRecommendations', []) ||
      safeGetValue(recommendations, 'aiRecommendations', []) ||
      [];

    if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
      return (
        <View style={recommendationsContainerStyle}>
          <Text style={sectionTitleStyle}>💡 AI Recommendations</Text>
          {aiRecommendations.map((recommendation, index) =>
            renderRecommendation(recommendation, index)
          )}
        </View>
      );
    }

    // If no structured recommendations, show raw data
    return (
      <View style={recommendationsContainerStyle}>
        <Text style={sectionTitleStyle}>📊 AI Analysis Result</Text>
        <View style={summaryCardStyle}>
          <Text style={rawDataTextStyle}>{JSON.stringify(recommendations, null, 2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={modalContainerStyle}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={headerContentStyle}>
            <Text style={headerTitleStyle}>🤖 AI Financial Advisor</Text>
            <TouchableOpacity onPress={handleClose} style={closeButtonStyle}>
              <Text style={closeButtonTextStyle}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={headerSubtitleStyle}>Get personalized financial recommendations</Text>
        </View>

        {/* Content */}
        <ScrollView style={contentStyle} showsVerticalScrollIndicator={false}>
          {/* Error State */}
          {error && !loading && (
            <View style={errorContainerStyle}>
              <View style={errorIconStyle}>
                <Text style={errorIconTextStyle}>⚠️</Text>
              </View>
              <Text style={errorTitleStyle}>Connection Error</Text>
              <Text style={errorDescriptionStyle}>{error}</Text>
              <TouchableOpacity style={retryButtonStyle} onPress={handleRetry}>
                <Text style={retryButtonTextStyle}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Welcome State */}
          {!recommendations && !loading && !error && (
            <View style={welcomeContainerStyle}>
              <View style={welcomeIconStyle}>
                <Text style={welcomeIconTextStyle}>💡</Text>
              </View>
              <Text style={welcomeTitleStyle}>Smart Financial Insights</Text>
              <Text style={welcomeDescriptionStyle}>
                Get AI-powered recommendations based on your financial data to improve your money
                management and achieve your goals faster.
              </Text>
              <TouchableOpacity
                style={getRecommendationsButtonStyle}
                onPress={handleGetRecommendations}
                disabled={loading}>
                <Text style={getRecommendationsButtonTextStyle}>Get AI Recommendations</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {loading && (
            <View style={loadingContainerStyle}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={loadingTextStyle}>Analyzing your financial data...</Text>
              <Text style={loadingSubTextStyle}>This may take a few moments</Text>
            </View>
          )}

          {/* Recommendations Content */}
          {recommendations && !loading && !error && renderSimpleRecommendations()}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Add the new styles
const priorityBadgeTextStyle = {
  fontSize: 12,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const rawDataTextStyle = {
  fontSize: 12,
  fontFamily: 'monospace' as const,
  color: '#374151',
  lineHeight: 16,
};

// ...existing styles... (keep all your existing styles)
const modalContainerStyle = {
  flex: 1,
  backgroundColor: '#F9FAFB',
};

const headerStyle = {
  backgroundColor: '#FFFFFF',
  paddingTop: 50,
  paddingHorizontal: 20,
  paddingBottom: 20,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const headerContentStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 8,
};

const headerTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#111827',
};

const headerSubtitleStyle = {
  fontSize: 16,
  color: '#6B7280',
  fontWeight: '500' as const,
};

const closeButtonStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const closeButtonTextStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const,
  color: '#6B7280',
};

const contentStyle = {
  flex: 1,
  padding: 20,
};

const errorContainerStyle = {
  alignItems: 'center' as const,
  paddingVertical: 60,
  paddingHorizontal: 32,
};

const errorIconStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#FEE2E2',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: 24,
};

const errorIconTextStyle = {
  fontSize: 32,
};

const errorTitleStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: '#111827',
  textAlign: 'center' as const,
  marginBottom: 12,
};

const errorDescriptionStyle = {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 24,
  marginBottom: 32,
};

const retryButtonStyle = {
  backgroundColor: '#EF4444',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 16,
  shadowColor: '#EF4444',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
};

const retryButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const welcomeContainerStyle = {
  alignItems: 'center' as const,
  paddingVertical: 60,
};

const welcomeIconStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#FEF3C7',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: 24,
};

const welcomeIconTextStyle = {
  fontSize: 32,
};

const welcomeTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: '#111827',
  textAlign: 'center' as const,
  marginBottom: 12,
};

const welcomeDescriptionStyle = {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center' as const,
  lineHeight: 24,
  marginBottom: 32,
  paddingHorizontal: 20,
};

const getRecommendationsButtonStyle = {
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

const getRecommendationsButtonTextStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

const loadingContainerStyle = {
  alignItems: 'center' as const,
  paddingVertical: 80,
};

const loadingTextStyle = {
  fontSize: 16,
  color: '#6B7280',
  marginTop: 16,
  textAlign: 'center' as const,
};

const loadingSubTextStyle = {
  fontSize: 14,
  color: '#9CA3AF',
  marginTop: 8,
  textAlign: 'center' as const,
};

const recommendationsContainerStyle = {
  paddingBottom: 40,
};

const summaryCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#111827',
  marginBottom: 16,
};

const recommendationCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const recommendationHeaderStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 12,
};

const recommendationCategoryStyle = {
  fontSize: 14,
  fontWeight: '600' as const,
  color: '#6B7280',
  textTransform: 'uppercase' as const,
};

const priorityBadgeStyle = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
};

const recommendationTitleStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#111827',
  marginBottom: 12,
  lineHeight: 24,
};

const impactContainerStyle = {
  marginBottom: 16,
};

const impactLabelStyle = {
  fontSize: 14,
  fontWeight: '600' as const,
  color: '#6B7280',
  marginBottom: 4,
};

const impactValueStyle = {
  fontSize: 15,
  color: '#374151',
};

const actionStepsContainerStyle = {
  marginTop: 8,
};

const actionStepsLabelStyle = {
  fontSize: 14,
  fontWeight: '600' as const,
  color: '#6B7280',
  marginBottom: 8,
};

const actionStepStyle = {
  flexDirection: 'row' as const,
  alignItems: 'flex-start' as const,
  marginBottom: 8,
};

const stepNumberStyle = {
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#3B82F6',
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  lineHeight: 20,
  marginRight: 12,
};

const stepTextStyle = {
  flex: 1,
  fontSize: 14,
  color: '#374151',
  lineHeight: 20,
};
