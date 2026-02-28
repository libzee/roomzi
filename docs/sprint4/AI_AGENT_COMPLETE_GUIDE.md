# AI Agent Implementation

A comprehensive guide for the AI agent implementation in the property management chat system with automated scheduling capabilities.

## How It Works

### Basic AI Responses
- **Trigger**: Tenant sends message → AI generates landlord response
- **Visual**: AI messages have blue background with "AI Assistant" label
- **Context**: Uses property details, tenant/landlord names, chat history

### Advanced Scheduling
- **Intent Detection**: Recognizes "schedule viewing", "see the place", "tour", etc.
- **Availability Check**: Weekdays 9 AM - 6 PM, Weekends 10 AM - 4 PM
- **Auto-Booking**: Creates viewing requests in database when available
- **Conflict Handling**: Suggests alternatives when conflicts found

## Example Workflows

### Successful Scheduling
```
Tenant: "Can I see the apartment tomorrow at 3pm?"
AI: ✅ Detects intent → Checks availability → Creates viewing request
AI: "Perfect! I've got you down for tomorrow at 3:00 PM."
```

### Schedule Conflict
```
Tenant: "How about Saturday morning?"
AI: ✅ Detects intent → ❌ Conflict found
AI: "I have another viewing Saturday morning. How about Saturday at 2 PM instead?"
```

## Technical Implementation

### Files Modified
- `backend/src/services/aiService.js` - Core AI logic
- `backend/src/services/calendarService.js` - Availability checking
- `backend/src/config/socket.js` - WebSocket integration
- `frontend/src/components/chat/ChatWindow.tsx` - AI message styling

### Database
- AI messages stored as regular messages (`sender_type: 'landlord'`)
- Uses existing `viewingRequest` table for scheduling
- No schema changes required

### AI Models
- **GPT-3.5-turbo**: Basic responses
- **GPT-4o-mini**: Intent detection and scheduling

## Troubleshooting

### Common Issues
- **AI not responding**: Check `OPENAI_API_KEY` in `.env`
- **Rate limits**: Upgrade OpenAI plan or implement rate limiting
- **Network timeouts**: Check internet connection and OpenAI status

### Debug
```bash
# Check API key loading
console.log('OpenAI API Key loaded:', !!process.env.OPENAI_API_KEY);

# Test API connectivity
curl https://api.openai.com/v1/models -H "Authorization: Bearer your-api-key"
```

## Configuration

### Customize AI Behavior
```javascript
// In aiService.js
const completion = await this.openai.chat.completions.create({
  model: "gpt-4",           // Better quality, higher cost
  max_tokens: 200,          // Longer responses
  temperature: 0.5,         // More conservative
});
```

### Disable AI
- Remove `OPENAI_API_KEY` from `.env`
- Restart backend server


## Benefits

### For Landlords
- ⏰ 24/7 availability for tenant scheduling
- 🚀 Instant response to inquiries
- 📊 Centralized viewing request management
- 🎯 Higher conversion rates

### For Tenants
- 💬 Natural communication experience
- ⚡ Immediate booking confirmations
- 🔄 Easy rescheduling options
- 📱 Mobile-friendly scheduling

## Future Enhancements

### Planned Features
- Calendar integration (Google Calendar, Outlook)
- Tenant preference learning
- Multi-language support
- Voice message processing
- Automated reminders (SMS/email)
- Property-specific availability rules

### Advanced Capabilities
- Configurable AI personalities
- Learning from landlord's previous responses
- Integration with property amenities and rules
- Handoff to human for complex issues
- Analytics dashboard for booking patterns 