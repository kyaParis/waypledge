import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import api, { Gratitude, Story, getApprovedStories, submitStory } from '../utils/api';

const OPEN_COLLECTIVE_URL = 'https://opencollective.com/waypledge';

type TabType = 'thanks' | 'stories';

export default function GratitudeWallScreen() {
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('thanks');
  
  // Data state
  const [gratitudeList, setGratitudeList] = useState<Gratitude[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Story submission modal
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [gratitudeRes, storiesRes] = await Promise.all([
        api.get('/gratitude/wall'),
        getApprovedStories(),
      ]);
      setGratitudeList(gratitudeRes.data);
      setStories(storiesRes);
    } catch (error) {
      console.error('Error loading gratitude wall:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSubmitStory = async () => {
    console.log('handleSubmitStory called');
    console.log('Title:', storyTitle, 'Length:', storyTitle.trim().length);
    console.log('Content length:', storyContent.trim().length);
    
    if (storyTitle.trim().length < 5) {
      Alert.alert('Title too short', 'Please enter a title with at least 5 characters');
      return;
    }
    if (storyContent.trim().length < 50) {
      Alert.alert('Story too short', 'Please share more of your story (at least 50 characters)');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting story...');
      const result = await submitStory(storyTitle.trim(), storyContent.trim());
      console.log('Story submitted successfully:', result);
      Alert.alert(
        'Story Submitted!',
        'Thank you for sharing! An admin will review your story before it appears on the wall.',
        [{ text: 'OK', onPress: () => {
          setShowStoryModal(false);
          setStoryTitle('');
          setStoryContent('');
        }}]
      );
    } catch (error: any) {
      console.error('Error submitting story:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit story');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gratitude Wall</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'thanks' && styles.activeTab]}
          onPress={() => setActiveTab('thanks')}
        >
          <MaterialIcons 
            name="favorite" 
            size={20} 
            color={activeTab === 'thanks' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'thanks' && styles.activeTabText]}>
            Thank Yous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stories' && styles.activeTab]}
          onPress={() => setActiveTab('stories')}
        >
          <MaterialIcons 
            name="auto-stories" 
            size={20} 
            color={activeTab === 'stories' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'stories' && styles.activeTabText]}>
            Stories
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {activeTab === 'thanks' ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/gratitude')}
          >
            <MaterialIcons name="volunteer-activism" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Say Thank You</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.storyButton]}
            onPress={() => setShowStoryModal(true)}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Share Your Story</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Support WayPledge Card */}
      <TouchableOpacity 
        style={styles.supportCard}
        onPress={() => Linking.openURL(OPEN_COLLECTIVE_URL)}
      >
        <View style={styles.supportCardContent}>
          <MaterialIcons name="favorite" size={28} color={Colors.accent} />
          <View style={styles.supportCardText}>
            <Text style={styles.supportCardTitle}>Support WayPledge</Text>
            <Text style={styles.supportCardSubtitle}>Help keep this community running</Text>
          </View>
        </View>
        <MaterialIcons name="open-in-new" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : activeTab === 'thanks' ? (
          /* Thank Yous Tab */
          gratitudeList.length > 0 ? (
            gratitudeList.map((item) => (
              <View key={item.id} style={styles.gratitudeCard}>
                <Text style={styles.gratitudeMessage}>"{item.message}"</Text>
                <View style={styles.gratitudeFooter}>
                  <Text style={styles.gratitudeAuthor}>
                    {item.from_user_name} → {item.to_user_name}
                  </Text>
                  <Text style={styles.gratitudeDate}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No thank yous yet</Text>
              <Text style={styles.emptyText}>Be the first to express gratitude!</Text>
            </View>
          )
        ) : (
          /* Stories Tab */
          stories.length > 0 ? (
            stories.map((story) => (
              <View key={story.id} style={styles.storyCard}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyContent}>{story.content}</Text>
                <View style={styles.storyFooter}>
                  <Text style={styles.storyAuthor}>— {story.user_name}</Text>
                  <Text style={styles.storyDate}>{formatDate(story.created_at)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="auto-stories" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No stories yet</Text>
              <Text style={styles.emptyText}>Share your WayPledge experience!</Text>
            </View>
          )
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Story Submission Modal */}
      <Modal
        visible={showStoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Story</Text>
              <TouchableOpacity onPress={() => setShowStoryModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Tell us about your WayPledge experience. How has giving or receiving helped you?
            </Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Give your story a title..."
              placeholderTextColor={Colors.textSecondary}
              value={storyTitle}
              onChangeText={setStoryTitle}
              maxLength={100}
            />

            <Text style={styles.inputLabel}>Your Story</Text>
            <TextInput
              style={styles.storyInput}
              placeholder="Share your experience..."
              placeholderTextColor={Colors.textSecondary}
              value={storyContent}
              onChangeText={setStoryContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{storyContent.length}/2000</Text>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitStory}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit for Review</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.reviewNote}>
              Stories are reviewed by admins before appearing on the wall.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.primaryLight || '#E3F2FD',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  storyButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  gratitudeCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  gratitudeMessage: {
    fontSize: 15,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12,
  },
  gratitudeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gratitudeAuthor: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  gratitudeDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  storyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  storyContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  storyAuthor: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  storyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  storyInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 160,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reviewNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  supportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  supportCardText: {
    flex: 1,
  },
  supportCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  supportCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
