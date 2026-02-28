import express from 'express';
import { supabase } from '../config/supabase.js';
import { createChat, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

// Use Prisma-based chat creation for POST /
router.post('/', createChat);

// Create a new chat room (Supabase)
router.post('/rooms', async (req, res) => {
  try {
    const { tenantId, landlordId, propertyId, tenantName, propertyName, landlordName } = req.body;
    console.log('[POST /rooms] tenantId:', tenantId, 'landlordId:', landlordId, 'propertyId:', propertyId);
    if (!tenantId || !landlordId || !propertyId) {
      return res.status(400).json({ error: 'Missing tenantId, landlordId, or propertyId' });
    }

    // Check if chat room already exists
    const { data: existingRoom } = await supabase
      .from('chats')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('landlord_id', landlordId)
      .eq('property_id', propertyId.toString())
      .single();

    if (existingRoom) {
      return res.json(existingRoom);
    }

    // Look up names if not provided
    let resolvedTenantName = tenantName;
    let resolvedLandlordName = landlordName;
    let resolvedPropertyName = propertyName;
    if (!tenantName) {
      console.log('[Chat Creation] Looking up tenant profile for ID:', tenantId);
      const { data: tenantProfile, error: tenantError } = await supabase
        .from('tenant_profiles')
        .select('full_name')
        .eq('id', tenantId)
        .single();
      if (tenantError) {
        console.error('[Chat Creation] Error looking up tenant profile:', tenantError);
        resolvedTenantName = null;
      } else if (tenantProfile) {
        console.log('[Chat Creation] Found tenant profile:', tenantProfile);
        resolvedTenantName = tenantProfile.full_name || null;
      } else {
        console.log('[Chat Creation] No tenant profile found for ID:', tenantId);
        resolvedTenantName = null;
      }
    }
    if (!landlordName) {
      const { data: landlordProfile } = await supabase
        .from('landlord_profiles')
        .select('full_name')
        .eq('id', landlordId)
        .single();
      resolvedLandlordName = landlordProfile?.full_name || null;
    }
    if (!propertyName) {
      const { data: property } = await supabase
        .from('listings')
        .select('title')
        .eq('id', propertyId)
        .single();
      resolvedPropertyName = property?.title || null;
    }

    // Create new chat room
    const { data: newRoom, error } = await supabase
      .from('chats')
      .insert([
        {
          tenant_id: tenantId,
          landlord_id: landlordId,
          property_id: propertyId.toString(),
          tenant_name: resolvedTenantName,
          property_name: resolvedPropertyName,
          landlord_name: resolvedLandlordName,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(newRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all chat rooms for a user (either as tenant or landlord)
router.get('/rooms/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching chat rooms for user:', userId);

    let { data: rooms, error } = await supabase
      .from('chats')
      .select('*')
      .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Populate missing tenant_name, property_name, landlord_name if possible
    for (const room of rooms) {
      // Tenant name - always get from tenant_profiles.full_name
      if (!room.tenant_name && room.tenant_id) {
        try {
          const { data: tenantProfile } = await supabase
            .from('tenant_profiles')
            .select('full_name')
            .eq('id', room.tenant_id)
            .single();
          if (tenantProfile && tenantProfile.full_name) {
            room.tenant_name = tenantProfile.full_name;
            await supabase
              .from('chats')
              .update({ tenant_name: tenantProfile.full_name })
              .eq('id', room.id);
          }
        } catch (e) {
          console.error('Error populating tenant_name:', e);
        }
      }
      // Property name
      if (!room.property_name && room.property_id) {
        try {
          const { data: property } = await supabase
            .from('listings')
            .select('title')
            .eq('id', room.property_id)
            .single();
          if (property && property.title) {
            room.property_name = property.title;
            await supabase
              .from('chats')
              .update({ property_name: property.title })
              .eq('id', room.id);
          }
        } catch (e) {
          console.error('Error populating property_name:', e);
        }
      }
      // Landlord name
      if (!room.landlord_name && room.landlord_id) {
        try {
          const { data: landlordProfile } = await supabase
            .from('landlord_profiles')
            .select('full_name')
            .eq('id', room.landlord_id)
            .single();
          if (landlordProfile && landlordProfile.full_name) {
            room.landlord_name = landlordProfile.full_name;
            await supabase
              .from('chats')
              .update({ landlord_name: landlordProfile.full_name })
              .eq('id', room.id);
          }
        } catch (e) {
          console.error('Error populating landlord_name:', e);
        }
      }
    }

    res.json(rooms || []); // Return empty array if no rooms found
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific chat room
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/messages', sendMessage);

// Find or create a chat room
router.post('/rooms/find-or-create', async (req, res) => {
  try {
    const { tenantId, landlordId, propertyId, tenantName, propertyName, landlordName } = req.body;
    console.log('[POST /rooms/find-or-create] tenantId:', tenantId, 'landlordId:', landlordId, 'propertyId:', propertyId);
    if (!tenantId || !landlordId || !propertyId) {
      return res.status(400).json({ error: 'Missing tenantId, landlordId, or propertyId' });
    }

    // Check if chat room already exists
    const { data: existingRoom } = await supabase
      .from('chats')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('landlord_id', landlordId)
      .eq('property_id', propertyId.toString())
      .single();

    if (existingRoom) {
      return res.json(existingRoom);
    }

    // Look up names if not provided
    let resolvedTenantName = tenantName;
    let resolvedLandlordName = landlordName;
    let resolvedPropertyName = propertyName;
    if (!tenantName) {
      console.log('[Chat Creation] Looking up tenant profile for ID:', tenantId);
      const { data: tenantProfile, error: tenantError } = await supabase
        .from('tenant_profiles')
        .select('full_name')
        .eq('id', tenantId)
        .single();
      if (tenantError) {
        console.error('[Chat Creation] Error looking up tenant profile:', tenantError);
        resolvedTenantName = null;
      } else if (tenantProfile) {
        console.log('[Chat Creation] Found tenant profile:', tenantProfile);
        resolvedTenantName = tenantProfile.full_name || null;
      } else {
        console.log('[Chat Creation] No tenant profile found for ID:', tenantId);
        resolvedTenantName = null;
      }
    }
    if (!landlordName) {
      const { data: landlordProfile } = await supabase
        .from('landlord_profiles')
        .select('full_name')
        .eq('id', landlordId)
        .single();
      resolvedLandlordName = landlordProfile?.full_name || null;
    }
    if (!propertyName) {
      const { data: property } = await supabase
        .from('listings')
        .select('title')
        .eq('id', propertyId)
        .single();
      resolvedPropertyName = property?.title || null;
    }

    // Create new chat room
    const { data: newRoom, error } = await supabase
      .from('chats')
      .insert([
        {
          tenant_id: tenantId,
          landlord_id: landlordId,
          property_id: propertyId.toString(),
          tenant_name: resolvedTenantName,
          property_name: resolvedPropertyName,
          landlord_name: resolvedLandlordName,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(newRoom);
  } catch (error) {
    console.error('Error in find-or-create chat room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a chat room (landlord only)
router.delete('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { landlordId } = req.body; // Landlord ID to verify ownership

    // First, verify the chat room exists and belongs to this landlord
    const { data: chatRoom, error: fetchError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', roomId)
      .eq('landlord_id', landlordId)
      .single();

    if (fetchError || !chatRoom) {
      return res.status(404).json({ error: 'Chat room not found or access denied' });
    }

    // Delete all messages in the chat room
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', roomId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return res.status(500).json({ error: 'Failed to delete messages' });
    }

    // Delete the chat room
    const { error: chatError } = await supabase
      .from('chats')
      .delete()
      .eq('id', roomId);

    if (chatError) {
      console.error('Error deleting chat room:', chatError);
      return res.status(500).json({ error: 'Failed to delete chat room' });
    }

    res.json({ success: true, message: 'Chat room deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 