import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import api from '../utils/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface HelpAIModalProps {
  visible: boolean;
  onClose: () => void;
}

const SYSTEM_PROMPT = `You are a friendly WayPledge helper. Answer questions about how to use WayPledge simply and clearly.

KEY INFORMATION ABOUT WAYPLEDGE:

**What is WayPledge?**
A gift economy app where people help each other freely - no money, no fees, no selling.

**Core Concepts:**
- PLEDGES: Things you offer to give/help with (tap Create → Pledge)
- WISHES: Things you need help with (tap Create → Wish)
- COMMUNITIES (HIVES): Local groups you can join to connect with people nearby

**Where to find things:**
- YOUR pledges & wishes → Profile tab (bottom right)
- BROWSE others' pledges & wishes → Browse tab
- CREATE a pledge or wish → Create tab (+ button)
- MESSAGES → Chat tab
- COMMUNITIES → Home screen "Find Your Community" card, or Profile → My Communities
- ACTIVITY FEED → Home screen shows what's happening in your communities

**Common Questions:**
- "Where are my pledges?" → Go to Profile tab, scroll down to "My Pledges"
- "How do I join a community?" → Home screen → tap "Find Your Community"
- "How do I contact someone?" → Tap their pledge/wish → "I can help" or "Contact"
- "How do I share WayPledge?" → Home screen has a Share button at the top

**The Philosophy:**
Give freely, receive gratefully. Trust flows in circles. No transactions, just people helping people.

Keep answers SHORT and friendly. Use simple language. If unsure, suggest they contact support.`;

export default function HelpAIModal({ visible, onClose }: HelpAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestedQuestions = [
    "Where are my pledges?",
    "How do I join a community?",
    "How do I contact someone?",
    "What's a pledge vs a wish?",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/signal/chat', {
        system: SYSTEM_PROMPT,
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response || "I'm not sure about that. Try asking differently or contact support."
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect. Please try again or contact support at help@waypledge.me"
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="help-outline" size={24} color={Colors.primary} />
            <Text style={styles.headerTitle}>WayPledge Help</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <MaterialIcons name="support-agent" size={48} color={Colors.primary} />
              <Text style={styles.welcomeTitle}>How can I help?</Text>
              <Text style={styles.welcomeText}>
                Ask me anything about using WayPledge
              </Text>
              
              <Text style={styles.suggestedTitle}>Common questions:</Text>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedButton}
                  onPress={() => sendMessage(question)}
                >
                  <Text style={styles.suggestedText}>{question}</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            messages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.role === 'user' && styles.userText
                ]}>
                  {message.content}
                </Text>
              </View>
            ))
          )}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <MaterialIcons name="send" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 32,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 12,
    width: '100%',
  },
  suggestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestedText: {
    fontSize: 15,
    color: Colors.text,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  userText: {
    color: Colors.surface,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
});
