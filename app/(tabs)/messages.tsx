import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Connection, Message, blockUser } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesScreen() {
  const user = useAuthStore((state) => state.user);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menuConnection, setMenuConnection] = useState<Connection | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadMessages(selectedConnection.id);
    }
  }, [selectedConnection]);

  const loadConnections = async () => {
    try {
      const response = await api.get('/connections');
      setConnections(response.data);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadMessages = async (connectionId: string) => {
    try {
      const response = await api.get(`/messages/${connectionId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear immediately to prevent double-send

    try {
      await api.post('/messages', {
        connection_id: selectedConnection.id,
        content: messageToSend,
      });
      await loadMessages(selectedConnection.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend); // Restore message if failed
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send message. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConnections();
    if (selectedConnection) {
      await loadMessages(selectedConnection.id);
    }
    setRefreshing(false);
  };

  const handleOpenMenu = (connection: Connection) => {
    setMenuConnection(connection);
    setShowMenu(true);
  };

  const handleArchiveConversation = async () => {
    if (!menuConnection) return;
    setShowMenu(false);
    Alert.alert(
      'Archive Conversation',
      'This will hide the conversation from your list. You can still view it later in your archived messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await api.post(`/connections/${menuConnection.id}/archive`);
              setConnections(connections.filter(c => c.id !== menuConnection.id));
              Alert.alert('Done', 'Conversation archived');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Could not archive conversation');
            }
          }
        }
      ]
    );
  };

  const handleBlockUser = async () => {
    if (!menuConnection) return;
    const otherUserId = menuConnection.pledger_id === user?.id 
      ? menuConnection.wisher_id 
      : menuConnection.pledger_id;
    const otherUserName = menuConnection.pledger_id === user?.id 
      ? menuConnection.wisher_name 
      : menuConnection.pledger_name;
    
    setShowMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUserName}? You won't see their pledges, wishes, or messages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(otherUserId);
              setConnections(connections.filter(c => c.id !== menuConnection.id));
              Alert.alert('Done', `${otherUserName} has been blocked`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Could not block user');
            }
          }
        }
      ]
    );
  };

  const handleReportConversation = () => {
    if (!menuConnection) return;
    const otherUserName = menuConnection.pledger_id === user?.id 
      ? menuConnection.wisher_name 
      : menuConnection.pledger_name;
    
    setShowMenu(false);
    Alert.alert(
      'Report Issue',
      `Report a problem with this conversation with ${otherUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: async () => {
            try {
              await api.post('/reports', {
                reported_type: 'conversation',
                reported_id: menuConnection.id,
                reason: 'User reported from messages screen'
              });
              Alert.alert('Thank You', 'Your report has been submitted. Our team will review it.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Could not submit report');
            }
          }
        }
      ]
    );
  };

  if (selectedConnection) {
    const otherUserId =
      selectedConnection.pledger_id === user?.id
        ? selectedConnection.wisher_id
        : selectedConnection.pledger_id;
    const otherUserName = 
      selectedConnection.pledger_id === user?.id
        ? selectedConnection.wisher_name
        : selectedConnection.pledger_name;
    const itemType = selectedConnection.item_type || (selectedConnection.pledge_id ? 'pledge' : 'wish');

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConnection(null)}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {selectedConnection.item_title || (itemType === 'pledge' ? 'Pledge' : 'Wish')}
            </Text>
            <Text style={styles.chatHeaderSubtitle}>
              Chatting with {otherUserName || 'Unknown'}
            </Text>
          </View>
          <View style={[
            styles.chatHeaderBadge,
            { backgroundColor: itemType === 'pledge' ? Colors.pledgeLight : Colors.wishLight }
          ]}>
            <MaterialIcons 
              name={itemType === 'pledge' ? 'card-giftcard' : 'star'} 
              size={18} 
              color={itemType === 'pledge' ? Colors.pledgeDark : Colors.wishDark} 
            />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {messages.map((message) => {
              const isMe = message.sender_id === user?.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  {!isMe && <Text style={styles.messageSender}>{message.sender_name}</Text>}
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.myMessageText : styles.theirMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text style={styles.messageTime}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              placeholderTextColor={Colors.textSecondary}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                newMessage.trim() ? styles.sendButtonActive : styles.sendButtonDisabled
              ]}
              onPress={() => {
                console.log('Send button pressed, message:', newMessage);
                sendMessage();
              }}
              activeOpacity={0.7}
              disabled={!newMessage.trim()}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={newMessage.trim() ? Colors.surface : Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <ScrollView
        style={styles.connectionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {connections.length > 0 ? (
          connections.map((connection) => {
            const isMyPledge = connection.pledger_id === user?.id;
            const otherPersonName = isMyPledge ? connection.wisher_name : connection.pledger_name;
            const itemType = connection.item_type || (connection.pledge_id ? 'pledge' : 'wish');
            
            return (
              <View key={connection.id} style={[
                styles.connectionCard,
                connection.has_unread && styles.connectionCardUnread
              ]}>
                <TouchableOpacity
                  style={styles.connectionContent}
                  onPress={() => setSelectedConnection(connection)}
                >
                  <View
                    style={[
                      styles.connectionIcon,
                      {
                        backgroundColor: itemType === 'pledge'
                          ? Colors.pledgeLight
                          : Colors.wishLight,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={itemType === 'pledge' ? 'card-giftcard' : 'star'}
                      size={24}
                      color={itemType === 'pledge' ? Colors.pledgeDark : Colors.wishDark}
                    />
                  </View>
                  <View style={styles.connectionInfo}>
                    <View style={styles.connectionTitleRow}>
                      <Text style={[
                        styles.connectionTitle,
                        connection.has_unread && styles.connectionTitleUnread
                      ]} numberOfLines={1}>
                        {connection.item_title || (itemType === 'pledge' ? 'Pledge' : 'Wish')}
                      </Text>
                      {connection.has_unread && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text style={styles.connectionPerson}>
                      with {otherPersonName || 'Unknown'}
                    </Text>
                    <Text style={styles.connectionSubtitle}>
                      {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => handleOpenMenu(connection)}
                >
                  <MaterialIcons name="more-vert" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="chat-bubble-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Messages appear when you connect with pledges or wishes
            </Text>
            <View style={styles.emptySteps}>
              <Text style={styles.emptyStepTitle}>How to start chatting:</Text>
              <Text style={styles.emptyStep}>1. Go to Browse tab</Text>
              <Text style={styles.emptyStep}>2. Find a pledge or wish</Text>
              <Text style={styles.emptyStep}>3. Click "Connect" button</Text>
              <Text style={styles.emptyStep}>4. Your conversation appears here!</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Conversation Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Options</Text>
            
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={handleArchiveConversation}
            >
              <MaterialIcons name="archive" size={24} color={Colors.text} />
              <Text style={styles.menuOptionText}>Archive conversation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={handleReportConversation}
            >
              <MaterialIcons name="flag" size={24} color={Colors.warning} />
              <Text style={[styles.menuOptionText, { color: Colors.warning }]}>Report an issue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={handleBlockUser}
            >
              <MaterialIcons name="block" size={24} color={Colors.error} />
              <Text style={[styles.menuOptionText, { color: Colors.error }]}>Block user</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuOption, styles.menuCancelOption]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  connectionsList: {
    flex: 1,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionCardUnread: {
    backgroundColor: Colors.primaryLight + '15',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  connectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  connectionTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  connectionPerson: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  connectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptySteps: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  emptyStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyStep: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    paddingLeft: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  chatHeaderSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
  },
  chatHeaderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.surface,
  },
  theirMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  connectionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginLeft: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuOptionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
  },
  menuCancelOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8,
  },
  menuCancelText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
