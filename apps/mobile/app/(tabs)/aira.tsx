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
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn,
  FadeInUp,
  useAnimatedStyle, 
  withRepeat, 
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  suggestions?: string[];
}

const QUICK_PROMPTS = [
  { icon: 'person-add', label: 'New Customer', prompt: 'Create a new customer' },
  { icon: 'briefcase', label: 'New Job', prompt: 'Schedule a new job' },
  { icon: 'document-text', label: 'Estimate', prompt: 'Create an estimate' },
  { icon: 'calendar', label: "Today's Schedule", prompt: "Show my schedule for today" },
];

export default function AIRAScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm AIRA, your AI-powered field service assistant. I can help you with customers, jobs, estimates, and more. What would you like to do?",
      timestamp: new Date(),
      suggestions: ['Create customer', 'Schedule job', 'View schedule'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList<DisplayMessage>>(null);
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isListening]);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

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
      // Simulate AI response - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse = getMockResponse(messageText);

      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading
            ? {
                ...msg,
                content: mockResponse.content,
                isLoading: false,
                suggestions: mockResponse.suggestions,
              }
            : msg
        )
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading
            ? {
                ...msg,
                content: "I'm having trouble connecting. Please try again.",
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(prev => !prev);

    if (!isListening) {
      // Show voice feedback
      setTimeout(() => setIsListening(false), 5000);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSend(prompt);
  };

  const handleSuggestion = (suggestion: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSend(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: DisplayMessage; index: number }) => {
    const isUser = item.role === 'user';

    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 50).springify()}
        style={[messageStyles.row, isUser && messageStyles.rowUser]}
      >
        {!isUser && (
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            style={messageStyles.avatarBot}
          >
            <Ionicons name="sparkles" size={16} color="white" />
          </LinearGradient>
        )}
        
        <View style={[
          messageStyles.bubble,
          isUser ? messageStyles.bubbleUser : messageStyles.bubbleBot,
          { backgroundColor: isUser ? '#6366f1' : (isDark ? '#1e293b' : '#ffffff') }
        ]}>
          {item.isLoading ? (
            <View style={messageStyles.loading}>
              <View style={messageStyles.typingDots}>
                {[0, 1, 2].map((i) => (
                  <Animated.View 
                    key={i}
                    style={[messageStyles.dot, { 
                      opacity: 0.5 + (i * 0.2),
                      backgroundColor: '#6366f1',
                    }]} 
                  />
                ))}
              </View>
              <Text style={[messageStyles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                AIRA is thinking...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[
                messageStyles.text,
                { color: isUser ? 'white' : (isDark ? '#f1f5f9' : '#1e293b') }
              ]}>
                {item.content}
              </Text>
              <Text style={[
                messageStyles.timestamp,
                { color: isUser ? 'rgba(255,255,255,0.6)' : '#9ca3af' }
              ]}>
                {formatTime(item.timestamp)}
              </Text>
              
              {/* Suggestions */}
              {item.suggestions && item.suggestions.length > 0 && (
                <View style={messageStyles.suggestions}>
                  {item.suggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[messageStyles.suggestionChip, { 
                        backgroundColor: isDark ? '#312e81' : '#ede9fe',
                        borderColor: isDark ? '#4f46e5' : '#c4b5fd',
                      }]}
                      onPress={() => handleSuggestion(suggestion)}
                    >
                      <Text style={[messageStyles.suggestionText, { color: '#6366f1' }]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {isUser && (
          <View style={[messageStyles.avatarUser, { backgroundColor: isDark ? '#475569' : '#94a3b8' }]}>
            <Ionicons name="person" size={16} color="white" />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.airaLogo}>
                <Ionicons name="sparkles" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.headerTitle}>AIRA</Text>
                <Text style={styles.headerSubtitle}>AI-Powered Assistant</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.clearBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMessages([{
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: "Chat cleared! How can I help you?",
                  timestamp: new Date(),
                  suggestions: ['Create customer', 'Schedule job', 'View schedule'],
                }]);
              }}
            >
              <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Quick Prompts */}
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickPromptBtn}
                onPress={() => handleQuickPrompt(prompt.prompt)}
              >
                <Ionicons name={prompt.icon as any} size={18} color="white" />
                <Text style={styles.quickPromptLabel}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Listening Indicator */}
        {isListening && (
          <Animated.View 
            entering={FadeIn}
            style={[styles.listeningBar, animatedPulse]}
          >
            <View style={styles.listeningDot} />
            <Text style={styles.listeningText}>Listening...</Text>
            <TouchableOpacity onPress={() => setIsListening(false)}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { 
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderTopColor: isDark ? '#334155' : '#e2e8f0',
        }]}>
          <Animated.View style={animatedPulse}>
            <TouchableOpacity
              style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
              onPress={handleVoicePress}
            >
              <Ionicons 
                name={isListening ? 'mic' : 'mic-outline'} 
                size={22} 
                color={isListening ? 'white' : '#6366f1'} 
              />
            </TouchableOpacity>
          </Animated.View>

          <TextInput
            style={[styles.textInput, { 
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              color: isDark ? '#f1f5f9' : '#1e293b',
            }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask AIRA anything..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={inputText.trim() && !isLoading ? ['#6366f1', '#8b5cf6'] : ['#cbd5e1', '#cbd5e1']}
              style={styles.sendBtnGradient}
            >
              <Ionicons name="send" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Mock response generator - replace with actual AI service
function getMockResponse(input: string): { content: string; suggestions?: string[] } {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('customer') || lowerInput.includes('client')) {
    return {
      content: "I can help you create a new customer! I'll need some information:\n\n• Customer name\n• Phone number\n• Address\n• Email (optional)\n\nWould you like to provide these details now, or should I walk you through it step by step?",
      suggestions: ['Walk me through it', 'I have all details', 'Cancel'],
    };
  }
  
  if (lowerInput.includes('job') || lowerInput.includes('schedule')) {
    return {
      content: "Let's schedule a new job! Here's what I need:\n\n• Customer (new or existing)\n• Service type\n• Preferred date & time\n• Any special notes\n\nWhich customer is this job for?",
      suggestions: ['Existing customer', 'New customer', 'View available slots'],
    };
  }
  
  if (lowerInput.includes('estimate')) {
    return {
      content: "I'll help you create an estimate! Would you like to:\n\n• Use a template (faster)\n• Build from scratch\n• Copy from existing estimate\n\nWhich approach works best?",
      suggestions: ['Use template', 'Build from scratch', 'Copy existing'],
    };
  }
  
  return {
    content: "I understand you're asking about \"" + input + "\". I can help with:\n\n• Creating customers\n• Scheduling jobs\n• Creating estimates & invoices\n• Viewing your schedule\n• Managing your workday\n\nWhat would you like to do?",
    suggestions: ['Show schedule', 'Create job', 'Create customer'],
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  airaLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPrompts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  quickPromptBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  quickPromptLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  listeningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  listeningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  listeningText: {
    flex: 1,
    color: '#dc2626',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    gap: 10,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: '#ef4444',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const messageStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleBot: {
    borderBottomLeftRadius: 6,
  },
  bubbleUser: {
    borderBottomRightRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 13,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
