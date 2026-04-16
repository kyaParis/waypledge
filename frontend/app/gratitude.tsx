import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { searchUsers, sendGratitude, UserSearchResult } from '../utils/api';

export default function SendGratitudeScreen() {
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Selected user state
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  
  // Message state
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Search for users
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) {
      Alert.alert('Search', 'Please enter at least 2 characters to search');
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);
  
  // Select a user
  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  // Clear selected user
  const handleClearSelection = () => {
    setSelectedUser(null);
    setMessage('');
    setHasSearched(false);
  };
  
  // Send gratitude
  const handleSendGratitude = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a person to thank');
      return;
    }
    
    if (message.trim().length < 10) {
      Alert.alert('Message too short', 'Please write at least 10 characters to express your gratitude');
      return;
    }
    
    setIsSending(true);
    try {
      await sendGratitude(selectedUser.id, message.trim());
      Alert.alert(
        'Gratitude Sent! 💛',
        `Your thank you message has been sent to ${selectedUser.name}. They will review and approve it to appear on the Gratitude Wall.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Send gratitude error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send gratitude. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Gratitude</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <View style={styles.introSection}>
            <MaterialIcons name="favorite" size={48} color={Colors.accent} />
            <Text style={styles.introTitle}>Say Thank You</Text>
            <Text style={styles.introText}>
              Search for someone in the WayPledge community to express your gratitude. 
              They don't need to have helped you directly - thank anyone who has made a difference!
            </Text>
          </View>

          {/* Selected User Card */}
          {selectedUser ? (
            <View style={styles.selectedUserSection}>
              <View style={styles.selectedUserCard}>
                <View style={styles.selectedUserInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                    {selectedUser.location ? (
                      <Text style={styles.selectedUserLocation}>
                        <MaterialIcons name="location-on" size={14} color={Colors.textSecondary} />
                        {' '}{selectedUser.location}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity onPress={handleClearSelection} style={styles.clearButton}>
                  <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Message Input */}
              <View style={styles.messageSection}>
                <Text style={styles.messageLabel}>Your Message of Gratitude</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Write your thank you message here... What did they do that you're grateful for? (min 10 characters)"
                  placeholderTextColor={Colors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[
                  styles.charCount,
                  message.trim().length < 10 && message.length > 0 && { color: Colors.error }
                ]}>
                  {message.length}/500 {message.trim().length < 10 && message.length > 0 ? '(need at least 10 characters)' : ''}
                </Text>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (isSending || message.trim().length < 10) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendGratitude}
                disabled={isSending || message.trim().length < 10}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <Text style={styles.sendButtonText}>Send Gratitude</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.noteText}>
                Note: {selectedUser.name} will need to approve your gratitude before it appears on the public Gratitude Wall.
              </Text>
            </View>
          ) : (
            /* Search Section */
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>Find Someone to Thank</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter name..."
                  placeholderTextColor={Colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="words"
                />
                <TouchableOpacity
                  style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialIcons name="search" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsTitle}>
                    Found {searchResults.length} {searchResults.length === 1 ? 'person' : 'people'}
                  </Text>
                  {searchResults.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.resultCard}
                      onPress={() => handleSelectUser(user)}
                    >
                      <View style={styles.resultAvatar}>
                        <Text style={styles.resultAvatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{user.name}</Text>
                        {user.location ? (
                          <Text style={styles.resultLocation}>{user.location}</Text>
                        ) : null}
                        {user.bio ? (
                          <Text style={styles.resultBio} numberOfLines={2}>{user.bio}</Text>
                        ) : null}
                      </View>
                      <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Results */}
              {hasSearched && searchResults.length === 0 && !isSearching && (
                <View style={styles.noResults}>
                  <MaterialIcons name="search-off" size={48} color={Colors.textSecondary} />
                  <Text style={styles.noResultsText}>No members found matching "{searchQuery}"</Text>
                  <Text style={styles.noResultsHint}>Try a different name or check the spelling</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  resultLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resultBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedUserSection: {
    marginBottom: 20,
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 14,
    flex: 1,
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedUserLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  messageSection: {
    marginTop: 24,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
