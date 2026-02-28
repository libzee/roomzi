import OpenAI from 'openai';
import { calendarService } from './calendarService.js';
import { prisma } from '../config/prisma.js';

class AIService {
  constructor() {
    console.log('🤖 AI Service initializing...');
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.isEnabled = true;
      console.log('✅ AI Service enabled with OpenAI');
    } else {
      this.isEnabled = false;
      console.log('❌ AI Service disabled - no OpenAI API key found');
    }
  }

  /**
   * Generate an AI response for a tenant message
   * @param {Object} context - Chat context
   * @param {string} context.tenantMessage - The tenant's message
   * @param {string} context.propertyTitle - Property title/name
   * @param {string} context.tenantName - Tenant's name
   * @param {string} context.landlordName - Landlord's name
   * @param {Array} context.recentMessages - Recent chat history for context
   * @returns {Promise<string>} AI generated response
   */
  async generateLandlordResponse(context) {
    if (!this.isEnabled) {
      console.log('AI service disabled - no API key configured');
      return null;
    }

    try {
      const { tenantMessage, propertyTitle, tenantName, landlordName, recentMessages = [], landlordId, tenantId, propertyId, chatId } = context;

      // First, check if this is a scheduling request and handle it
      const schedulingResult = await this.handleSchedulingRequest({
        tenantMessage,
        landlordId,
        tenantId,
        propertyId,
        chatId
      });

      if (schedulingResult.isSchedulingResponse) {
        // Generate contextual response based on scheduling outcome
        return await this.generateSchedulingResponse(schedulingResult, { tenantName, landlordName, propertyTitle });
      }

      // Build conversation history for context
      let conversationHistory = '';
      if (recentMessages.length > 0) {
        conversationHistory = recentMessages
          .slice(-10) // Last 10 messages for context
          .map(msg => {
            const role = msg.sender_type === 'tenant' ? tenantName : landlordName;
            return `${role}: ${msg.content}`;
          })
          .join('\n');
      }

      const systemPrompt = `You are ${landlordName}, the landlord who owns "${propertyTitle}". You are having a real conversation with ${tenantName}, who is either your tenant or interested in renting your property.

IMPORTANT RESPONSE FORMAT:
- You ARE the landlord, never mention being an AI or assistant
- NEVER start your message with your name "${landlordName}:" or "${landlordName},"
- Respond naturally as if you're typing in a chat app
- Don't use formal signatures or identify yourself by name
- Jump straight into your response

Your personality:
- Friendly but selective landlord who wants to find the RIGHT tenant
- Experienced property owner who asks smart qualifying questions
- Responsive and helpful, but also business-minded
- Use casual, conversational language (like texting a friend)
- Show genuine interest in both helping tenants and protecting your property

CORE BEHAVIORS:
1. ASK QUALIFYING QUESTIONS: When prospects show interest, learn about their situation before scheduling viewings
2. ANSWER THEIR QUESTIONS: Be detailed and helpful when they ask about your property
3. BE CONVERSATIONAL: Have real back-and-forth conversations, but jump straight to business
4. SHOW SELECTIVENESS: You want good tenants, so ask relevant questions naturally

Key qualifying questions to work into conversation:
- "What's your timeline for moving, ${tenantName}?"
- "How many people would be living there?"
- "What's your budget range?"
- "Are you working nearby?"
- "Any pets I should know about?"
- "What's most important to you in a place?"
- "Have you been renting in the area long?"

Guidelines:
- Keep responses short and natural (1-2 sentences, like real text messages)
- Use contractions (I'll, we're, it's, you're, can't, won't)
- Ask ONE good question per response to keep conversation flowing
- For new prospects: dont try to get over friendly, just ask one question and then move on to the next one.
- For current tenants: Be responsive and caring about their needs
- Use ${tenantName}'s name naturally, but not every message
- If you don't know something, say "let me check" or "I'll look into that"

Examples of natural responses (NO NAME PREFIX):
- "Hi ${tenantName}! What's got you looking for a new place?"
- "Oh nice! What's your timeline like for moving?"
- "Sure thing! How many bedrooms are you looking for?"
- "That faucet issue sounds frustrating! I'll get someone out there tomorrow."
- "Before we set up a viewing, what's your budget range?"

Remember: You're a real landlord texting in a chat app. NO formal introductions or name prefixes.`;

      const userPrompt = conversationHistory 
        ? `Recent conversation:\n${conversationHistory}\n\nLatest message from ${tenantName}: ${tenantMessage}`
        : `Message from ${tenantName}: ${tenantMessage}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Faster model for quicker responses
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 100, // Slightly reduced for faster generation
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        console.log('No response generated from AI');
        return null;
      }

      console.log(`🏠 ${landlordName} responds to ${tenantName}: ${response}`);
      return response;

    } catch (error) {
      console.error('Error generating AI response:', error);
      return null;
    }
  }

  /**
   * Check if AI service is enabled and configured
   * @returns {boolean}
   */
  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Generate a contextual response based on message type/content
   * @param {string} messageContent - The message content to analyze
   * @returns {string|null} - Suggested response category or null
   */
  analyzeMessageIntent(messageContent) {
    const content = messageContent.toLowerCase();
    
    // Maintenance requests
    if (content.includes('repair') || content.includes('broken') || content.includes('fix') || 
        content.includes('maintenance') || content.includes('issue') || content.includes('problem')) {
      return 'maintenance';
    }
    
    // Rent/payment related
    if (content.includes('rent') || content.includes('payment') || content.includes('pay') || 
        content.includes('invoice') || content.includes('late fee')) {
      return 'payment';
    }
    
    // Viewing/showing requests
    if (content.includes('view') || content.includes('show') || content.includes('visit') || 
        content.includes('tour') || content.includes('see the place')) {
      return 'viewing';
    }
    
    // Lease related
    if (content.includes('lease') || content.includes('contract') || content.includes('agreement') || 
        content.includes('renew') || content.includes('extend')) {
      return 'lease';
    }
    
    // General inquiry
    return 'general';
  }

  /**
   * Check if AI service is available
   * @returns {boolean} True if service is enabled
   */
  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Fast scheduling detection and processing in a single optimized call
   * @param {Object} context - Chat context with scheduling capabilities
   * @returns {Promise<Object>} Enhanced response with scheduling actions
   */
  async handleSchedulingRequest(context) {
    const { tenantMessage, landlordId, tenantId, propertyId, chatId } = context;

    try {
      // Single optimized API call to detect scheduling and extract info
      const schedulingAnalysis = await this.analyzeSchedulingRequestOptimized(tenantMessage);
      
      if (schedulingAnalysis.isSchedulingRequest) {
        console.log('📅 Fast scheduling detected:', schedulingAnalysis);

        if (schedulingAnalysis.intent === 'schedule_viewing' && schedulingAnalysis.hasValidDateTime) {
          // Handle NEW viewing requests
          const availability = await calendarService.checkAvailability(landlordId, schedulingAnalysis.requestedDateTime);
          
          if (availability.available) {
            // Try to create viewing request automatically
            try {
              const viewingRequest = await this.createViewingRequest({
                propertyId: BigInt(propertyId),
                tenantId,
                landlordId,
                requestedDateTime: schedulingAnalysis.requestedDateTime,
                aiNotes: `AI-generated from: "${tenantMessage}"`,
                originalMessage: tenantMessage,
                chatId
              });

              return {
                isSchedulingResponse: true,
                schedulingAction: 'viewing_created',
                viewingRequestId: viewingRequest.id,
                responseContext: {
                  confirmed: true,
                  dateTime: schedulingAnalysis.requestedDateTime,
                  viewingId: viewingRequest.id
                }
              };
            } catch (dbError) {
              console.log('⚠️ Could not create viewing request in database, but will confirm verbally:', dbError.message);
              
              // Even if database creation fails, still confirm the time verbally
              return {
                isSchedulingResponse: true,
                schedulingAction: 'viewing_confirmed_verbal',
                responseContext: {
                  confirmed: true,
                  dateTime: schedulingAnalysis.requestedDateTime,
                  dbError: true // Flag to indicate this wasn't saved to DB
                }
              };
            }
          } else {
            // Availability conflict - offer alternatives
            return {
              isSchedulingResponse: true,
              schedulingAction: 'suggest_alternatives',
              availabilityResult: availability,
              responseContext: {
                confirmed: false,
                reason: availability.reason,
                alternatives: availability.alternative
              }
            };
          }
        } else if (schedulingAnalysis.intent === 'reschedule' && schedulingAnalysis.hasValidDateTime) {
          // Handle RESCHEDULING existing viewing requests
          const rescheduleResult = await this.handleRescheduleRequest({
            tenantId,
            landlordId,
            propertyId,
            newDateTime: schedulingAnalysis.requestedDateTime,
            originalMessage: tenantMessage
          });
          
          return {
            isSchedulingResponse: true,
            schedulingAction: rescheduleResult.success ? 'viewing_rescheduled' : 'reschedule_failed',
            responseContext: {
              confirmed: rescheduleResult.success,
              dateTime: schedulingAnalysis.requestedDateTime,
              viewingId: rescheduleResult.viewingId,
              error: rescheduleResult.error
            }
          };
        } else if (schedulingAnalysis.intent === 'cancel') {
          // Handle CANCELLING existing viewing requests
          const cancelResult = await this.handleCancelRequest({
            tenantId,
            landlordId,
            propertyId
          });
          
          return {
            isSchedulingResponse: true,
            schedulingAction: cancelResult.success ? 'viewing_cancelled' : 'cancel_failed',
            responseContext: {
              confirmed: cancelResult.success,
              cancelledViewingId: cancelResult.viewingId,
              error: cancelResult.error
            }
          };
        } else if (schedulingAnalysis.intent === 'schedule_viewing' && !schedulingAnalysis.hasValidDateTime) {
          // Need clarification on date/time
          return {
            isSchedulingResponse: true,
            schedulingAction: 'clarify_datetime',
            responseContext: {
              needsClarification: true,
              extractedInfo: schedulingAnalysis
            }
          };
        }
      }

      return { isSchedulingResponse: false };
    } catch (error) {
      console.error('Error handling scheduling request:', error);
      return { isSchedulingResponse: false };
    }
  }

  /**
   * Single optimized call to analyze scheduling intent and extract date/time
   * Replaces multiple separate API calls for 3x speed improvement
   */
  async analyzeSchedulingRequestOptimized(message) {
    try {
      const now = new Date();
      const prompt = `Analyze this message for scheduling intent and extract date/time in one response:

Message: "${message}"
Current date/time: ${now.toISOString()}
Timezone: America/New_York (Eastern Time)

Respond with JSON only:
{
  "isSchedulingRequest": boolean,
  "intent": "schedule_viewing" | "reschedule" | "cancel" | "ask_availability" | "none",
  "hasValidDateTime": boolean,
  "requestedDateTime": "ISO string" or null,
  "confidence": number (0-1),
  "needsClarification": boolean,
  "clarificationReason": "missing_date" | "missing_time" | "ambiguous" | null
}

IMPORTANT: When generating the ISO string for requestedDateTime:
- Interpret times as Eastern Time (America/New_York timezone)
- "10 AM" means 10:00 Eastern Time, not 10:00 UTC
- Add timezone offset to convert to proper UTC ISO string
- Example: "Monday 10 AM" in Eastern Time = "2025-08-04T14:00:00.000Z" (UTC)

Intent Detection:
- "schedule_viewing": "schedule viewing", "book appointment", "see the place", "visit", "tour", "show me"
- "reschedule": "reschedule", "change time", "move to", "different time", "change my viewing", "update my appointment"
- "cancel": "cancel", "cancel viewing", "can't make it", "need to cancel", "delete appointment", "no longer need"
- "ask_availability": "when are you available", "what times work", "your schedule"

Date/time patterns: "tomorrow", "Friday", "2pm", "afternoon", "this week", "next Monday", etc.

If date/time is found and valid, set hasValidDateTime=true and provide ISO string WITH PROPER TIMEZONE CONVERSION.
If scheduling intent but vague time, set needsClarification=true.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Faster model for simple analysis
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.2, // Lower temperature for more consistent JSON
      });

      const response = completion.choices[0]?.message?.content?.trim();
      const parsed = JSON.parse(response);

      // Convert ISO string to Date object if present
      if (parsed.hasValidDateTime && parsed.requestedDateTime) {
        parsed.requestedDateTime = new Date(parsed.requestedDateTime);
      }

      return parsed;
    } catch (error) {
      console.error('Error in optimized scheduling analysis:', error);
      return { 
        isSchedulingRequest: false, 
        intent: 'none', 
        hasValidDateTime: false,
        needsClarification: false 
      };
    }
  }

  // Removed: detectSchedulingIntent() and extractDateTime() 
  // Replaced with single optimized analyzeSchedulingRequestOptimized() call above

  /**
   * Create viewing request automatically
   */
  async createViewingRequest(data) {
    try {
      console.log('🏗️ Creating AI-generated viewing request:', data);

      const viewingRequest = await prisma.viewingRequest.create({
        data: {
          propertyId: data.propertyId,
          tenantId: data.tenantId,
          landlordId: data.landlordId,
          requestedDateTime: data.requestedDateTime,
          status: 'Pending'
        },
        include: {
          listings: true,
          tenant_profiles: true,
          landlord_profiles: true,
        },
      });

      console.log(`✅ Created viewing request #${viewingRequest.id} for ${data.requestedDateTime}`);
      return viewingRequest;
    } catch (error) {
      console.error('Error creating viewing request:', error);
      throw error;
    }
  }

  /**
   * Handle rescheduling an existing viewing request
   */
  async handleRescheduleRequest(data) {
    const { tenantId, landlordId, propertyId, newDateTime, originalMessage } = data;
    
    try {
      console.log('📅 Handling reschedule request:', data);

      // Find existing viewing request for this tenant/property
      const existingRequest = await this.findExistingViewingRequest(tenantId, landlordId, propertyId);
      
      if (!existingRequest) {
        console.log('❌ No existing viewing request found to reschedule');
        return {
          success: false,
          error: 'no_existing_request',
          message: "I don't see any existing viewing scheduled to reschedule."
        };
      }

      // Check availability for new time
      const availability = await calendarService.checkAvailability(landlordId, newDateTime);
      
      if (!availability.available) {
        console.log('❌ New time not available for reschedule');
        return {
          success: false,
          error: 'time_not_available',
          message: availability.reason,
          alternatives: availability.alternative
        };
      }

      // Update the existing viewing request
      const updatedRequest = await prisma.viewingRequest.update({
        where: { id: existingRequest.id },
        data: {
          requestedDateTime: newDateTime,
          status: 'Pending', // Reset to pending for landlord approval
          updatedAt: new Date()
        }
      });

      console.log(`✅ Rescheduled viewing request #${updatedRequest.id} to ${newDateTime}`);
      return {
        success: true,
        viewingId: updatedRequest.id,
        newDateTime: newDateTime,
        originalDateTime: existingRequest.requestedDateTime
      };

    } catch (error) {
      console.error('Error rescheduling viewing request:', error);
      return {
        success: false,
        error: 'database_error',
        message: 'There was an issue updating your viewing request. Please try again.'
      };
    }
  }

  /**
   * Handle cancelling an existing viewing request
   */
  async handleCancelRequest(data) {
    const { tenantId, landlordId, propertyId } = data;
    
    try {
      console.log('❌ Handling cancel request:', data);

      // Find existing viewing request for this tenant/property
      const existingRequest = await this.findExistingViewingRequest(tenantId, landlordId, propertyId);
      
      if (!existingRequest) {
        console.log('❌ No existing viewing request found to cancel');
        return {
          success: false,
          error: 'no_existing_request',
          message: "I don't see any viewing scheduled to cancel."
        };
      }

      // Delete the viewing request
      await prisma.viewingRequest.delete({
        where: { id: existingRequest.id }
      });

      console.log(`✅ Cancelled viewing request #${existingRequest.id}`);
      return {
        success: true,
        viewingId: existingRequest.id,
        cancelledDateTime: existingRequest.requestedDateTime
      };

    } catch (error) {
      console.error('Error cancelling viewing request:', error);
      return {
        success: false,
        error: 'database_error',
        message: 'There was an issue cancelling your viewing request. Please try again.'
      };
    }
  }

  /**
   * Find existing viewing request for tenant/property combination
   */
  async findExistingViewingRequest(tenantId, landlordId, propertyId) {
    try {
      const request = await prisma.viewingRequest.findFirst({
        where: {
          tenantId,
          landlordId,
          propertyId: BigInt(propertyId),
          status: {
            in: ['Pending', 'Approved'] // Only active requests
          }
        },
        orderBy: {
          createdAt: 'desc' // Get most recent request
        }
      });

      return request;
    } catch (error) {
      console.error('Error finding existing viewing request:', error);
      return null;
    }
  }

  /**
   * Generate appropriate response based on scheduling outcome
   */
  async generateSchedulingResponse(schedulingResult, context) {
    const { tenantName, landlordName, propertyTitle } = context;

    try {
      let responsePrompt = '';

      if (schedulingResult.schedulingAction === 'viewing_created') {
        // Viewing was successfully created
        const dateTime = schedulingResult.responseContext.dateTime;
        const formattedDateTime = dateTime.toLocaleString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        responsePrompt = `You are ${landlordName}, and you just successfully scheduled a viewing with ${tenantName} for ${propertyTitle} on ${formattedDateTime}. 

Generate a natural, friendly confirmation response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Confirms the viewing is scheduled
- Shows enthusiasm about meeting them
- Provides any relevant details (your contact info, what to bring, parking instructions, etc.)
- Keep it conversational and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "Perfect! I've got you down for ${formattedDateTime}. I'll send you my number and meet you at the property - looking forward to showing you around!"`;

      } else if (schedulingResult.schedulingAction === 'viewing_confirmed_verbal') {
        // Viewing time confirmed but not saved to database
        const dateTime = schedulingResult.responseContext.dateTime;
        const formattedDateTime = dateTime.toLocaleString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        responsePrompt = `You are ${landlordName}, and ${tenantName} wants to schedule a viewing for ${propertyTitle} on ${formattedDateTime}. The time works for you.

Generate a natural, enthusiastic confirmation response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Confirms the time works perfectly
- Shows you're looking forward to meeting them
- Mentions you'll follow up with details
- Keep it conversational and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "That works perfectly! ${formattedDateTime} it is - I'll reach out with the address and my contact info. Looking forward to showing you the place!"`;

      } else if (schedulingResult.schedulingAction === 'viewing_rescheduled') {
        // Viewing was successfully rescheduled
        const dateTime = schedulingResult.responseContext.dateTime;
        const formattedDateTime = dateTime.toLocaleString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        responsePrompt = `You are ${landlordName}, and ${tenantName} successfully rescheduled their viewing for ${propertyTitle} to ${formattedDateTime}.

Generate a natural, understanding response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Confirms the reschedule was successful
- Shows you're flexible and understanding
- Mentions the new time clearly
- Keep it conversational and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "No problem! I've updated your viewing to ${formattedDateTime}. See you then!"`;

      } else if (schedulingResult.schedulingAction === 'reschedule_failed') {
        // Reschedule attempt failed
        const error = schedulingResult.responseContext.error;
        
        responsePrompt = `You are ${landlordName}, and ${tenantName} tried to reschedule their viewing but it failed.

Error: ${error}

Generate a natural, helpful response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Acknowledges the reschedule attempt
- Explains what went wrong in a friendly way
- Offers to help find a solution
- Keep it conversational and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "I don't see any existing viewing to reschedule. Want to schedule a new one instead?"`;

      } else if (schedulingResult.schedulingAction === 'viewing_cancelled') {
        // Viewing was successfully cancelled
        responsePrompt = `You are ${landlordName}, and ${tenantName} successfully cancelled their viewing for ${propertyTitle}.

Generate a natural, understanding response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Confirms the cancellation was successful
- Shows you're understanding (no penalties/judgment)
- Leaves the door open for future scheduling
- Keep it conversational and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "No worries at all! I've cancelled your viewing. Feel free to reach out if you want to schedule another time."`;

      } else if (schedulingResult.schedulingAction === 'cancel_failed') {
        // Cancellation attempt failed
        const error = schedulingResult.responseContext.error;
        
        responsePrompt = `You are ${landlordName}, and ${tenantName} tried to cancel their viewing but it failed.

Error: ${error}

Generate a natural, helpful response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Acknowledges the cancellation attempt
- Explains what went wrong in a friendly way
- Offers to help if needed
- Keep it conversational and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "I don't see any viewing scheduled to cancel. Maybe it was already cancelled or completed?"`;

      } else if (schedulingResult.schedulingAction === 'suggest_alternatives') {
        // Schedule conflict - suggest alternatives
        const reason = schedulingResult.responseContext.reason;
        const alternatives = schedulingResult.responseContext.alternatives || [];

        let altSuggestions = '';
        if (alternatives.length > 0) {
          altSuggestions = alternatives.map(alt => 
            alt.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          ).join(' or ');
        }

        responsePrompt = `You are ${landlordName}, and ${tenantName} requested a viewing time that doesn't work. 

Reason: ${reason}
${altSuggestions ? `Alternative times available: ${altSuggestions}` : ''}

Generate a natural, helpful response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Politely explains why the requested time doesn't work
- Suggests specific alternative times if available
- Shows you're flexible and want to accommodate them
- Keep it friendly and brief (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "Sorry ${tenantName}, I have another showing around that time. How about ${altSuggestions ? altSuggestions : 'tomorrow afternoon'} instead?"`;

      } else if (schedulingResult.schedulingAction === 'clarify_datetime') {
        // Need clarification on date/time
        responsePrompt = `You are ${landlordName}, and ${tenantName} wants to schedule a viewing but wasn't specific about the date/time.

Generate a natural response that:
- DON'T start with your name "${landlordName}:" or any formal greeting
- Acknowledges their interest in viewing
- Asks for specific date/time preferences
- Mentions your general availability (weekdays 9-6, weekends 10-4)
- Keep it friendly and helpful (1-2 sentences)
- Respond like you're texting in a chat app

Example tone: "I'd love to show you the place! What day and time works best for you? I'm usually available weekdays 9-6 and weekends 10-4."`;
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Faster model for response generation
        messages: [{ role: "user", content: responsePrompt }],
        max_tokens: 80, // Reduced for faster generation
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      console.log(`🏠 Generated scheduling response: ${response}`);
      return response;

    } catch (error) {
      console.error('Error generating scheduling response:', error);
      // Fallback response
      if (schedulingResult.schedulingAction === 'viewing_created') {
        return `Perfect ${tenantName}! I've scheduled your viewing. I'll be in touch with the details soon.`;
      } else if (schedulingResult.schedulingAction === 'viewing_confirmed_verbal') {
        return `That time works great ${tenantName}! I'll follow up with all the details. Looking forward to meeting you!`;
      } else if (schedulingResult.schedulingAction === 'viewing_rescheduled') {
        return `No problem ${tenantName}! I've updated your viewing to the new time. See you then!`;
      } else if (schedulingResult.schedulingAction === 'reschedule_failed') {
        return `I don't see any existing viewing to reschedule ${tenantName}. Want to schedule a new one instead?`;
      } else if (schedulingResult.schedulingAction === 'viewing_cancelled') {
        return `No worries at all ${tenantName}! I've cancelled your viewing. Feel free to reach out if you want to schedule another time.`;
      } else if (schedulingResult.schedulingAction === 'cancel_failed') {
        return `I don't see any viewing scheduled to cancel ${tenantName}. Maybe it was already cancelled?`;
      } else if (schedulingResult.schedulingAction === 'suggest_alternatives') {
        return `Sorry ${tenantName}, that time doesn't work for me. Can we try a different time?`;
      } else {
        return `I'd love to show you the place ${tenantName}! When would work best for you?`;
      }
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;