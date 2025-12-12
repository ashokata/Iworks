import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { aiChatService, ChatMessage } from '../../services/aiChatService';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function AIRAScreen() {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm AIRA, your AI field service assistant. I can help you create customers, schedule jobs, and manage your work. Try saying something like:\n\n• \"Create a new customer named John Smith\"\n• \"Schedule a repair job for tomorrow\"\n• \"Show my schedule for today\"",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList<DisplayMessage>>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isLoading) return;

    // Add user message
    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedText,
      timestamp: new Date(),
    };

    // Add loading placeholder for AI response
    const loadingMessage: DisplayMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(trimmedText);

      // Replace loading message with actual response
      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading
            ? {
                ...msg,
                content: response.reply,
                isLoading: false,
              }
            : msg
        )
      );

      // Vibrate on response (haptic feedback)
      Vibration.vibrate(50);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading
            ? {
                ...msg,
                content: "I'm having trouble connecting right now. Please check your connection and try again.",
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoicePress = () => {
    setIsListening(prev => !prev);
    Vibration.vibrate(100);

    if (!isListening) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '🎤 Voice input is ready! Speak your command clearly. (Note: Full voice recognition requires native module setup. For now, please type your message.)',
          timestamp: new Date(),
        },
      ]);
      
      setTimeout(() => {
        setIsListening(false);
      }, 5000);
    }
  };

  const handleClearChat = () => {
    aiChatService.resetConversation();
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Chat cleared! I'm AIRA, ready to help. What would you like to do?",
        timestamp: new Date(),
      },
    ]);
    Vibration.vibrate(50);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBot}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" />
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleBot,
          ]}
        >
          {item.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.messageTextUser : styles.messageTextBot,
                ]}
              >
                {item.content}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  isUser ? styles.timestampUser : styles.timestampBot,
                ]}
              >
                {formatTime(item.timestamp)}
              </Text>
            </>
          )}
        </View>
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarUser}>
              <Ionicons name="person" size={18} color="#ffffff" />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Voice Indicator */}
        {isListening && (
          <View style={styles.listeningIndicator}>
            <Animated.View
              style={[
                styles.listeningDot,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearChat}
          >
            <Ionicons name="trash-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.voiceButton,
              isListening && styles.voiceButtonActive,
              { transform: [{ scale: isListening ? pulseAnim : 1 }] },
            ]}
          >
            <TouchableOpacity onPress={handleVoicePress} disabled={isLoading}>
              <Ionicons 
                name={isListening ? "mic-off" : "mic"} 
                size={24} 
                color={isListening ? "#ffffff" : "#2563eb"} 
              />
            </TouchableOpacity>
          </Animated.View>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask AIRA anything..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>AIRA • Powered by AWS Bedrock AI</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleBot: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleUser: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextBot: {
    color: '#1f2937',
  },
  messageTextUser: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  timestampBot: {
    color: '#9ca3af',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  listeningDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  listeningText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    padding: 10,
    marginRight: 4,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9ca3af',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
});
