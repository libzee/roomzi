import { prisma } from '../config/prisma.js';

class CalendarService {
  constructor() {
    this.defaultAvailability = {
      // Default availability: weekdays 9 AM - 6 PM, weekends 10 AM - 4 PM
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '10:00', end: '16:00', available: true },
      sunday: { start: '10:00', end: '16:00', available: false }
    };
    
    // Simple in-memory cache for availability checks (5 minute TTL)
    this.availabilityCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if a landlord is available at the requested time
   * @param {string} landlordId - Landlord's UUID
   * @param {Date} requestedDateTime - Requested viewing time
   * @returns {Promise<Object>} Availability result
   */
  async checkAvailability(landlordId, requestedDateTime) {
    try {
      // Check cache first for faster responses
      const cacheKey = `${landlordId}-${requestedDateTime.getTime()}`;
      const cached = this.availabilityCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log(`⚡ Cache hit for availability check: ${landlordId}`);
        return cached.result;
      }

      console.log(`📅 Checking availability for landlord ${landlordId} at ${requestedDateTime}`);
      
      const requestedDate = new Date(requestedDateTime);
      // Extract time - since AI now provides proper timezone-adjusted ISO strings
      const requestedTime = requestedDate.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      });
      const dayName = this.getDayName(requestedDate.getDay());

      // Check general availability for this day
      const dayAvailability = this.defaultAvailability[dayName];
      if (!dayAvailability.available) {
        return {
          available: false,
          reason: `I'm not typically available on ${this.capitalize(dayName)}s`,
          alternative: this.suggestAlternative(requestedDate)
        };
      }

      // Check if time is within available hours
      if (requestedTime < dayAvailability.start || requestedTime > dayAvailability.end) {
        return {
          available: false,
          reason: `I'm usually available ${dayAvailability.start} - ${dayAvailability.end} on ${this.capitalize(dayName)}s`,
          alternative: this.suggestTimeAlternative(requestedDate, dayAvailability)
        };
      }

      // Check for existing viewing requests at the same time (±1 hour buffer)
      try {
        const existingViewings = await this.getExistingViewings(landlordId, requestedDate);
        if (existingViewings.length > 0) {
          const result = {
            available: false,
            reason: "I have another viewing scheduled around that time",
            alternative: this.suggestAlternative(requestedDate)
          };

          // Cache conflict result
          this.availabilityCache.set(cacheKey, { 
            result, 
            timestamp: Date.now() 
          });

          return result;
        }
      } catch (dbError) {
        console.log('⚠️ Database check failed, assuming no conflicts:', dbError.message);
        // Continue with availability check even if database query fails
      }

      // Check if it's too close to current time (need at least 2 hours notice)
      const now = new Date();
      const hoursUntilViewing = (requestedDate - now) / (1000 * 60 * 60);
      if (hoursUntilViewing < 2) {
        const result = {
          available: false,
          reason: "I need at least 2 hours notice for viewings",
          alternative: this.suggestAlternative(new Date(now.getTime() + 24 * 60 * 60 * 1000)) // Tomorrow
        };

        // Cache negative result temporarily (shorter TTL)
        this.availabilityCache.set(cacheKey, { 
          result, 
          timestamp: Date.now() 
        });

        return result;
      }

      const result = {
        available: true,
        reason: "That time works for me!",
        confirmedTime: requestedDate
      };

      // Cache the positive result
      this.availabilityCache.set(cacheKey, { 
        result, 
        timestamp: Date.now() 
      });

      return result;

    } catch (error) {
      console.error('Error checking availability:', error);
      const errorResult = {
        available: false,
        reason: "Let me check my calendar and get back to you",
        alternative: null
      };

      // Don't cache error results
      return errorResult;
    }
  }

  /**
   * Get existing viewing requests around the requested time (optimized)
   */
  async getExistingViewings(landlordId, requestedDate) {
    const startTime = new Date(requestedDate.getTime() - 60 * 60 * 1000); // 1 hour before
    const endTime = new Date(requestedDate.getTime() + 60 * 60 * 1000); // 1 hour after

    // Optimized query - only select what we need and use index
    return await prisma.viewingRequest.findMany({
      where: {
        landlordId,
        requestedDateTime: {
          gte: startTime,
          lte: endTime
        },
        status: {
          in: ['Pending', 'Approved']
        }
      },
      select: {
        id: true,
        requestedDateTime: true,
        status: true
      } // Only select necessary fields for faster query
    });
  }

  /**
   * Get day name from day number
   */
  getDayName(dayNumber) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  }

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Suggest alternative time slots
   */
  suggestAlternative(aroundDate) {
    const alternatives = [];
    const baseDate = new Date(aroundDate);

    // Try next 3 days
    for (let i = 1; i <= 3; i++) {
      const altDate = new Date(baseDate);
      altDate.setDate(baseDate.getDate() + i);
      const dayName = this.getDayName(altDate.getDay());
      const dayAvailability = this.defaultAvailability[dayName];

      if (dayAvailability.available) {
        // Suggest morning slot
        const morningTime = new Date(altDate);
        morningTime.setHours(10, 0, 0, 0);
        alternatives.push(morningTime);

        // Suggest afternoon slot if different
        if (dayAvailability.end >= '15:00') {
          const afternoonTime = new Date(altDate);
          afternoonTime.setHours(15, 0, 0, 0);
          alternatives.push(afternoonTime);
        }
      }
    }

    return alternatives.slice(0, 2); // Return up to 2 alternatives
  }

  /**
   * Suggest alternative time on the same day
   */
  suggestTimeAlternative(requestedDate, dayAvailability) {
    const sameDay = new Date(requestedDate);
    
    // Suggest a time within available hours
    const startHour = parseInt(dayAvailability.start.split(':')[0]);
    const endHour = parseInt(dayAvailability.end.split(':')[0]);
    const suggestedHour = Math.min(Math.max(startHour + 2, 10), endHour - 1);
    
    sameDay.setHours(suggestedHour, 0, 0, 0);
    return [sameDay];
  }

  /**
   * Format date for human-readable suggestion
   */
  formatDateSuggestion(date) {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

export const calendarService = new CalendarService();