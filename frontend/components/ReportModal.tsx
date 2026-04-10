import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { blockUser } from '../utils/api';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportType: 'pledge' | 'wish' | 'user' | 'other';
  itemId?: string;
  itemTitle?: string;
  userId?: string; // The user who created the content (for blocking)
  userName?: string;
}

export default function ReportModal({
  visible,
  onClose,
  reportType,
  itemId,
  itemTitle,
  userId,
  userName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const reasons = [
    { id: 'inappropriate', label: 'Inappropriate Content', icon: 'warning' },
    { id: 'spam', label: 'Spam', icon: 'block' },
    { id: 'abuse', label: 'Abuse/Harassment', icon: 'report' },
    { id: 'scam', label: 'Scam/Fraud', icon: 'gavel' },
    { id: 'other', label: 'Other', icon: 'more-horiz' },
  ];

  const handleBlockUser = async () => {
    if (!userId) {
      Alert.alert('Error', 'Cannot block this user');
      return;
    }

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName || 'this user'}? You will no longer see their pledges, wishes, or receive messages from them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setIsBlocking(true);
            try {
              await blockUser(userId);
              Alert.alert('Blocked', `${userName || 'User'} has been blocked.`);
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to block user');
            } finally {
              setIsBlocking(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!selectedReason || !description.trim()) {
      alert('Please select a reason and provide details');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reports', {
        report_type: reportType,
        item_id: itemId,
        item_title: itemTitle,
        reason: selectedReason,
        description: description.trim(),
      });

      alert('Report submitted successfully. Thank you for helping keep WayPledge safe.');
      setSelectedReason('');
      setDescription('');
      onClose();
    } catch (error: any) {
      alert('Failed to submit report: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <MaterialIcons name="flag" size={32} color={Colors.error} />
              <Text style={styles.title}>Report Issue</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {itemTitle && (
              <View style={styles.itemInfo}>
                <Text style={styles.itemLabel}>Reporting:</Text>
                <Text style={styles.itemTitle}>{itemTitle}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Select Reason:</Text>
            <View style={styles.reasonsContainer}>
              {reasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonButton,
                    selectedReason === reason.id && styles.reasonButtonActive,
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <MaterialIcons
                    name={reason.icon as any}
                    size={24}
                    color={selectedReason === reason.id ? Colors.surface : Colors.error}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.id && styles.reasonTextActive,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Provide Details:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Please describe the issue in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              placeholderTextColor={Colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color={Colors.surface} />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>

            {userId && (
              <TouchableOpacity
                style={[styles.blockButton, isBlocking && styles.submitButtonDisabled]}
                onPress={handleBlockUser}
                disabled={isBlocking}
              >
                {isBlocking ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <>
                    <MaterialIcons name="block" size={20} color={Colors.surface} />
                    <Text style={styles.submitButtonText}>Block This User</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.disclaimer}>
              Reports are reviewed by administrators. False reports may result in account action.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  itemInfo: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  itemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  reasonsContainer: {
    marginBottom: 24,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  reasonButtonActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  reasonTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  blockButton: {
    backgroundColor: '#666',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
