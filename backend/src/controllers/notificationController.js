import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Get notification summary for a user (all notification data in one request)
export const getNotificationSummary = async (req, res) => {
  try {
    const { userId, userType } = req.params; // userType: 'tenant' or 'landlord'

    if (!userId || !userType) {
      return res.status(400).json({
        error: "Missing required parameters: userId and userType"
      });
    }

    // Helper function to validate UUIDs
    const isValidUUID = (uuid) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    // Get unread message count
    const getUnreadMessageCount = async () => {
      try {
        const where = userType === 'tenant' 
          ? { tenant_id: userId }
          : { landlord_id: userId };

        const chats = await prisma.chats.findMany({
          where,
          select: {
            id: true,
            tenant_last_read: true,
            landlord_last_read: true,
            messages: {
              where: {
                sender_id: {
                  not: userId // Don't count user's own messages
                }
              },
              select: {
                created_at: true
              },
              orderBy: { created_at: 'desc' }
            }
          }
        });

        let totalUnread = 0;
        for (const chat of chats) {
          const lastReadTime = userType === 'tenant' ? chat.tenant_last_read : chat.landlord_last_read;
          
          if (lastReadTime) {
            // Count messages after the last read time
            const unreadMessages = chat.messages.filter(msg => 
              new Date(msg.created_at) > new Date(lastReadTime)
            );
            totalUnread += unreadMessages.length;
          } else {
            // If never read, count all messages from the other user
            totalUnread += chat.messages.length;
          }
        }

        return totalUnread;
      } catch (error) {
        console.error('Error getting unread message count:', error);
        return 0;
      }
    };

    // Get pending maintenance count
    const getPendingMaintenanceCount = async () => {
      try {
        if (userType === 'landlord') {
          const count = await prisma.maintenance_requests.count({
            where: {
              landlordId: userId,
              status: 'Pending'
            }
          });
          return count;
        } else {
          // For tenants, count their pending maintenance requests
          const count = await prisma.maintenance_requests.count({
            where: {
              tenantId: userId,
              status: 'Pending'
            }
          });
          return count;
        }
      } catch (error) {
        console.error('Error getting pending maintenance count:', error);
        return 0;
      }
    };

    // Get new lease notifications
    const getNewLeaseNotifications = async () => {
      try {
        if (userType === 'landlord') {
          // For landlords: get signed leases that haven't been seen
          const leases = await prisma.leases.findMany({
            where: {
              signed: true,
              landlordseen: false
            },
            include: {
              listings: {
                select: {
                  landlord_id: true
                }
              }
            }
          });

          // Filter leases for this landlord's properties
          const landlordLeases = leases.filter(lease => 
            lease.listings?.landlord_id === userId
          );

          return landlordLeases.map(lease => ({
            id: lease.id,
            listingId: lease.listing_id.toString(),
            tenantId: lease.tenant_id,
            signed: lease.signed,
            landlordseen: lease.landlordseen,
            createdAt: lease.created_at
          }));
        } else {
          // For tenants: get unsigned leases (leases they need to sign)
          const leases = await prisma.leases.findMany({
            where: {
              tenant_id: userId,
              signed: false
            },
            select: {
              id: true,
              listing_id: true,
              tenant_id: true,
              signed: true,
              created_at: true
            }
          });

          return leases.map(lease => ({
            id: lease.id,
            listingId: lease.listing_id.toString(),
            tenantId: lease.tenant_id,
            signed: lease.signed,
            createdAt: lease.created_at
          }));
        }
      } catch (error) {
        console.error('Error getting new lease notifications:', error);
        return [];
      }
    };

    // Get pending viewing requests count
    const getPendingViewingCount = async () => {
      try {
        if (userType === 'landlord') {
          const count = await prisma.viewing_requests.count({
            where: {
              landlordId: userId,
              status: 'Pending'
            }
          });
          return count;
        } else {
          const count = await prisma.viewing_requests.count({
            where: {
              tenantId: userId,
              status: 'Pending'
            }
          });
          return count;
        }
      } catch (error) {
        console.error('Error getting pending viewing count:', error);
        return 0;
      }
    };

    // Execute all notification checks in parallel
    const [unreadMessages, pendingMaintenance, newLeases, pendingViewings] = await Promise.all([
      getUnreadMessageCount(),
      getPendingMaintenanceCount(),
      getNewLeaseNotifications(),
      getPendingViewingCount()
    ]);

    const notificationSummary = {
      unreadMessages,
      pendingMaintenance,
      newLeases,
      pendingViewings,
      timestamp: new Date().toISOString(),
      userType
    };

    res.json(successResponse(notificationSummary, "Notification summary retrieved successfully"));
  } catch (error) {
    console.error("Error getting notification summary:", error);
    res.status(500).json(errorResponse(error));
  }
}; 