import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { router } from 'expo-router';
import api from '../utils/api';

export default function FederateScreen() {
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!platformName || !platformUrl || !apiEndpoint || !contactEmail || !description || !location) {
      alert('Please fill in all fields');
      return;
    }
    if (!pledgeAgreed) {
      alert('You must agree to the Do No Harm Pledge to join the network');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/federation/request', {
        platform_name: platformName,
        platform_url: platformUrl,
        api_endpoint: apiEndpoint,
        contact_email: contactEmail,
        description,
        location,
        pledge_agreement: pledgeAgreed,
      });
      setSubmitted(true);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={80} color={Colors.success} />
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successText}>
            Thank you for wanting to join the network. We'll review your request and reach out 
            to the contact email provided.
          </Text>
          <Text style={styles.successNote}>
            Once approved, you'll receive an API key to sync your pledges and wishes with the 
            WayPledge honeycomb network.
          </Text>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
            <Text style={styles.homeButtonText}>Return Home</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Join the Network</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.introSection}>
          <MaterialIcons name="hub" size={48} color={Colors.accent} />
          <Text style={styles.introTitle}>Connect Your Platform</Text>
          <Text style={styles.introText}>
            Running a gift economy platform? Join the WayPledge honeycomb network. 
            Your pledges and wishes become part of a global giving ecosystem.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Platform Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., UPledge, GiftCircle"
              placeholderTextColor={Colors.textSecondary}
              value={platformName}
              onChangeText={setPlatformName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Platform URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-platform.org"
              placeholderTextColor={Colors.textSecondary}
              value={platformUrl}
              onChangeText={setPlatformUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>API Endpoint *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-platform.org/api"
              placeholderTextColor={Colors.textSecondary}
              value={apiEndpoint}
              onChangeText={setApiEndpoint}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Your API endpoint for syncing pledges/wishes
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@your-platform.org"
              placeholderTextColor={Colors.textSecondary}
              value={contactEmail}
              onChangeText={setContactEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Global, Europe, California"
              placeholderTextColor={Colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>About Your Platform *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your platform and how it aligns with the gift economy vision..."
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={styles.pledgeCheckbox}
            onPress={() => setPledgeAgreed(!pledgeAgreed)}
          >
            <MaterialIcons
              name={pledgeAgreed ? 'check-box' : 'check-box-outline-blank'}
              size={28}
              color={pledgeAgreed ? Colors.primary : Colors.textSecondary}
            />
            <View style={styles.pledgeTextContainer}>
              <Text style={styles.pledgeLabel}>
                I agree to the Do No Harm Pledge
              </Text>
              <Text style={styles.pledgeSubtext}>
                Our platform commits to: No selling, no fees, genuine giving and receiving, 
                respectful community, and removing bad actors.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, !pledgeAgreed && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !pledgeAgreed}
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

          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              After approval, you'll receive an API key. Use it to sync your pledges/wishes 
              to the network. Your users' offerings will appear in global searches across all 
              connected platforms.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  pledgeCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  pledgeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  pledgeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  pledgeSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.border,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
  },
  successText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  successNote: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  homeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
  },
  homeButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
