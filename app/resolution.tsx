import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import { router } from 'expo-router';
import { 
  createResolution, 
  getMyResolutions, 
  escalateResolution,
  Resolution,
  ResolutionRequest 
} from '../utils/api';

const ISSUE_TYPES = [
  { id: 'dispute', label: 'Dispute with another user', icon: 'people' },
  { id: 'technical', label: 'Technical issue', icon: 'build' },
  { id: 'account', label: 'Account problem', icon: 'person' },
  { id: 'safety', label: 'Safety concern', icon: 'shield' },
  { id: 'other', label: 'Other', icon: 'help' },
];

export default function ResolutionScreen() {
  const { isAuthenticated } = useAuthStore();
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  
  // Form state
  const [issueType, setIssueType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadResolutions();
    }
  }, [isAuthenticated]);

  const loadResolutions = async () => {
    try {
      setLoading(true);
      const data = await getMyResolutions();
      setResolutions(data);
    } catch (error) {
      console.error('Error loading resolutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!issueType || !subject.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const request: ResolutionRequest = {
        issue_type: issueType,
        subject: subject.trim(),
        description: description.trim(),
      };
      
      const newResolution = await createResolution(request);
      setResolutions([newResolution, ...resolutions]);
      setShowNewForm(false);
      setSelectedResolution(newResolution);
      
      // Reset form
      setIssueType('');
      setSubject('');
      setDescription('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (resolutionId: string) => {
    Alert.alert(
      'Escalate to Admin',
      'Would you like to escalate this issue to a human admin? They will review and respond as soon as possible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          onPress: async () => {
            try {
              await escalateResolution(resolutionId);
              await loadResolutions();
              Alert.alert('Escalated', 'Your request has been escalated to an admin.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to escalate');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.warning;
      case 'ai_responded': return Colors.primary;
      case 'escalated': return Colors.accent;
      case 'resolved': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'ai_responded': return 'AI Responded';
      case 'escalated': return 'With Admin';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthContainer}>
          <MaterialIcons name="support-agent" size={64} color={Colors.border} />
          <Text style={styles.notAuthTitle}>Resolution Centre</Text>
          <Text style={styles.notAuthText}>Please log in to access support</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Resolution Centre</Text>
          <Text style={styles.subtitle}>Get help with any issues</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* New Request Button */}
        <TouchableOpacity 
          style={styles.newRequestButton}
          onPress={() => setShowNewForm(true)}
        >
          <MaterialIcons name="add-circle" size={24} color={Colors.surface} />
          <Text style={styles.newRequestText}>Report an Issue</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="smart-toy" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>AI-Powered Support</Text>
            <Text style={styles.infoText}>
              Our AI assistant will help resolve your issue. If needed, you can escalate to a human admin.
            </Text>
          </View>
        </View>

        {/* Resolution List */}
        <Text style={styles.sectionTitle}>Your Requests</Text>
        
        {resolutions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No requests yet</Text>
            <Text style={styles.emptySubtext}>Tap "Report an Issue" if you need help</Text>
          </View>
        ) : (
          resolutions.map((resolution) => (
            <TouchableOpacity 
              key={resolution.id}
              style={styles.resolutionCard}
              onPress={() => setSelectedResolution(resolution)}
            >
              <View style={styles.resolutionHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(resolution.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(resolution.status) }]}>
                    {getStatusLabel(resolution.status)}
                  </Text>
                </View>
                <Text style={styles.resolutionDate}>
                  {new Date(resolution.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.resolutionSubject}>{resolution.subject}</Text>
              <Text style={styles.resolutionType}>
                {ISSUE_TYPES.find(t => t.id === resolution.issue_type)?.label || resolution.issue_type}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* New Request Modal */}
      <Modal
        visible={showNewForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewForm(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report an Issue</Text>
              <TouchableOpacity onPress={() => setShowNewForm(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.formLabel}>What type of issue?</Text>
              <View style={styles.issueTypesContainer}>
                {ISSUE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.issueTypeButton,
                      issueType === type.id && styles.issueTypeButtonActive
                    ]}
                    onPress={() => setIssueType(type.id)}
                  >
                    <MaterialIcons 
                      name={type.icon as any} 
                      size={20} 
                      color={issueType === type.id ? Colors.primary : Colors.textSecondary} 
                    />
                    <Text style={[
                      styles.issueTypeText,
                      issueType === type.id && styles.issueTypeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief summary of your issue"
                placeholderTextColor={Colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please describe your issue in detail. The more context you provide, the better we can help."
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color={Colors.surface} />
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Resolution Detail Modal */}
      <Modal
        visible={selectedResolution !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedResolution(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setSelectedResolution(null)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedResolution && (
              <ScrollView style={styles.modalScroll}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedResolution.status) + '20', alignSelf: 'flex-start', marginBottom: 16 }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedResolution.status) }]}>
                    {getStatusLabel(selectedResolution.status)}
                  </Text>
                </View>

                <Text style={styles.detailLabel}>Subject</Text>
                <Text style={styles.detailText}>{selectedResolution.subject}</Text>

                <Text style={styles.detailLabel}>Your Description</Text>
                <Text style={styles.detailText}>{selectedResolution.description}</Text>

                {selectedResolution.ai_response && (
                  <>
                    <View style={styles.aiResponseContainer}>
                      <View style={styles.aiResponseHeader}>
                        <MaterialIcons name="smart-toy" size={20} color={Colors.primary} />
                        <Text style={styles.aiResponseTitle}>AI Response</Text>
                      </View>
                      <Text style={styles.aiResponseText}>{selectedResolution.ai_response}</Text>
                    </View>
                  </>
                )}

                {selectedResolution.admin_response && (
                  <View style={styles.adminResponseContainer}>
                    <View style={styles.adminResponseHeader}>
                      <MaterialIcons name="admin-panel-settings" size={20} color={Colors.accent} />
                      <Text style={styles.adminResponseTitle}>Admin Response</Text>
                    </View>
                    <Text style={styles.adminResponseText}>{selectedResolution.admin_response}</Text>
                  </View>
                )}

                {selectedResolution.status === 'ai_responded' && (
                  <View style={styles.escalateSection}>
                    <Text style={styles.escalateText}>
                      Did this help resolve your issue?
                    </Text>
                    <View style={styles.escalateButtons}>
                      <TouchableOpacity
                        style={styles.resolvedButton}
                        onPress={() => {
                          Alert.alert('Great!', 'Glad we could help!');
                          setSelectedResolution(null);
                        }}
                      >
                        <MaterialIcons name="check" size={20} color={Colors.success} />
                        <Text style={styles.resolvedButtonText}>Yes, resolved</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.escalateButton}
                        onPress={() => {
                          handleEscalate(selectedResolution.id);
                          setSelectedResolution(null);
                        }}
                      >
                        <MaterialIcons name="support-agent" size={20} color={Colors.surface} />
                        <Text style={styles.escalateButtonText}>Talk to Admin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {selectedResolution.status === 'escalated' && (
                  <View style={styles.waitingMessage}>
                    <MaterialIcons name="hourglass-top" size={24} color={Colors.accent} />
                    <Text style={styles.waitingText}>
                      An admin will review your request and respond soon.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  notAuthText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  newRequestText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  resolutionCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  resolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resolutionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resolutionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  resolutionType: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalScroll: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  issueTypesContainer: {
    gap: 8,
  },
  issueTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  issueTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  issueTypeText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  issueTypeTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  aiResponseContainer: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiResponseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  aiResponseText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  adminResponseContainer: {
    backgroundColor: Colors.accent + '15',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adminResponseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  adminResponseText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  escalateSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  escalateText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  escalateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resolvedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  resolvedButtonText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  escalateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  escalateButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  waitingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  waitingText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
