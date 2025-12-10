# AI Chatbot Component - Mendix/Bedrock Integration

## Overview

This directory contains the AI chatbot components that integrate with your Mendix backend and AWS Bedrock LLM services. The chatbot provides an intuitive, modern conversational interface for users to interact with your Field Service Management application.

## Components

### 1. ChatBot Component (`ChatBot.tsx`)
The main chat interface component featuring:
- **Modern, Gradient UI**: Beautiful gradient header with blue theme
- **Message History**: Scrollable conversation history
- **Streaming Support**: Real-time streaming responses for better UX
- **Typing Indicators**: Visual feedback while AI is responding
- **Auto-scroll**: Automatically scrolls to latest messages
- **Clear Chat**: Option to reset conversation
- **Responsive Design**: Works on all screen sizes

### 2. ChatButton Component (`ChatButton.tsx`)
A floating action button that:
- **Fixed Position**: Stays in bottom-right corner
- **Animated**: Smooth hover and scale animations
- **Tooltip**: Shows helpful text on hover
- **Notification Badge**: Red dot to attract attention
- **Toggle**: Opens and closes the chat window

### 3. AI Chat Service (`src/services/aiChatService.ts`)
Handles all API communication:
- **Message Sending**: POST requests to Mendix/Bedrock API
- **Streaming Support**: Server-Sent Events (SSE) for streaming responses
- **Conversation Management**: Maintains conversation context
- **Error Handling**: Graceful error handling and fallbacks

## Integration with Your Mendix/Bedrock API

### Current Implementation (Mock)

Currently, the chatbot uses mock API endpoints for testing:
- `POST /api/ai/chat` - Regular chat endpoint
- `POST /api/ai/chat/stream` - Streaming chat endpoint

### Integrating with Your Actual Mendix API

To connect to your Mendix backend with Bedrock LLM:

#### Option 1: Direct Integration (Recommended)

Update `src/services/aiChatService.ts`:

```typescript
// Change the endpoint URLs to your Mendix API endpoints
async sendMessage(message: string, context?: Record<string, any>): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>(
    '/odata/your-mendix-module/v1/ChatMessages', // Your Mendix OData endpoint
    {
      message,
      conversationId: this.conversationId || undefined,
      context,
    }
  );
  return response;
}
```

#### Option 2: Via API Proxy

Add your Mendix API configuration to `.env.local`:

```bash
NEXT_PUBLIC_MENDIX_CHAT_ENDPOINT=https://your-mendix-app.mendixcloud.com/api/chat
NEXT_PUBLIC_MENDIX_API_KEY=your-api-key-here
```

Update the service to use environment variables.

### Expected API Contract

#### Request Format:
```json
{
  "message": "User's message here",
  "conversationId": "optional-conversation-id",
  "context": {
    "userId": "user123",
    "tenantId": "tenant456",
    "additionalContext": "any relevant data"
  }
}
```

#### Response Format:
```json
{
  "message": "AI response here",
  "conversationId": "conv_12345",
  "metadata": {
    "model": "bedrock-claude-v2",
    "tokens": 150,
    "confidence": 0.95
  }
}
```

#### Streaming Response Format (SSE):
```
data: {"content": "First ", "conversationId": "conv_12345"}

data: {"content": "chunk ", "conversationId": "conv_12345"}

data: {"content": "here", "conversationId": "conv_12345"}

data: [DONE]
```

## Mendix-Specific Configuration

### Agent Configuration

The chatbot is designed to work with Mendix Agent Builder. You can configure:

1. **System Prompt**: Define the AI's behavior and capabilities
2. **Knowledge Base**: Connect to your Mendix knowledge base
3. **Context**: Pass tenant ID, user info, and app context
4. **Tools/Actions**: Enable the AI to trigger Mendix microflows

Example context passed to Mendix:
```typescript
const context = {
  tenantId: currentTenant.id,
  userId: user.id,
  userRole: user.role,
  currentPage: pathname,
  // Add any other relevant context
};
```

### Bedrock LLM Models

The service is compatible with AWS Bedrock models including:
- Claude (Anthropic) - Recommended for conversational AI
- Titan (Amazon)
- Jurassic (AI21 Labs)

Configure your model preference in your Mendix backend.

## Features

### 1. **Conversational Context**
The chatbot maintains conversation history through `conversationId`, allowing the AI to remember previous messages.

### 2. **Streaming Responses**
For better UX, responses stream word-by-word instead of appearing all at once.

### 3. **Error Handling**
- Graceful fallback to non-streaming if streaming fails
- User-friendly error messages
- Console logging for debugging

### 4. **Modern UI/UX**
- Gradient header with online status
- Message bubbles (blue for user, white for AI)
- Smooth animations and transitions
- Timestamp for each message
- Loading indicators

## Customization

### Styling
The chatbot uses Tailwind CSS. You can customize:
- Colors: Modify gradient and bubble colors in `ChatBot.tsx`
- Size: Adjust width/height in the component
- Position: Change fixed positioning in `ChatButton.tsx`

### Behavior
- **Auto-open**: Add logic to open chat on certain conditions
- **Notifications**: Show notification badge when new messages arrive
- **Pre-filled Messages**: Start with specific questions
- **Quick Replies**: Add buttons for common questions

### Integration Points

The chatbot can be enhanced to:
1. **Create Jobs**: Parse user intent and create jobs via API
2. **Search Data**: Query customers, technicians, or jobs
3. **Navigate**: Guide users to specific pages
4. **Show Reports**: Generate and display data visualizations
5. **Update Records**: Modify existing data through conversation

## Testing

### Testing the Mock Implementation

1. Start the dev server: `npm run dev`
2. Navigate to any page
3. Click the floating chat button
4. Try these test messages:
   - "How do I create a job?"
   - "Tell me about customer management"
   - "I need help with scheduling"
   - "Show me the reports"

### Testing with Real Mendix API

1. Update the API endpoints in `aiChatService.ts`
2. Configure authentication headers
3. Test with your Mendix test environment
4. Monitor Mendix runtime logs for debugging

## Security Considerations

1. **Authentication**: All API calls include auth token from `apiClient`
2. **Tenant Isolation**: Tenant ID is automatically added to requests
3. **Input Validation**: Sanitize user input before sending to API
4. **Rate Limiting**: Consider implementing rate limits for API calls
5. **Data Privacy**: Ensure sensitive data is not logged

## Deployment Checklist

- [ ] Update API endpoints to production URLs
- [ ] Configure API keys and secrets
- [ ] Test conversation flow
- [ ] Test streaming functionality
- [ ] Verify error handling
- [ ] Check mobile responsiveness
- [ ] Test with different user roles
- [ ] Monitor API usage and costs
- [ ] Set up logging and monitoring
- [ ] Document common user questions

## Support

For issues or questions:
1. Check Mendix runtime logs
2. Review browser console for errors
3. Verify API endpoint configuration
4. Test API endpoints directly (Postman/curl)
5. Check AWS Bedrock service status

## Future Enhancements

- Voice input support
- File/image upload capability
- Rich media responses (cards, buttons)
- Multi-language support
- Sentiment analysis
- Analytics dashboard
- A/B testing different prompts
- Integration with more Mendix modules
