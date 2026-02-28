import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, User, Settings, MessageCircle, Search, Grid, Map as MapIcon, LogOut, Calendar as CalendarIcon, XCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Property } from '@/data/sampleProperties';
import { useNavigate, useLocation } from 'react-router-dom';
import Map from '@/components/Map';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/utils/api';
import { getApiBaseUrl, getLeasesForTenant, getNotificationSummary, tenantApi } from '@/utils/api';
import { calculateDistance, parseCoordinates, geocodeAddress } from '@/lib/utils';

// Helper to safely parse JSON fields
const parseMaybeJson = (value, fallback = []) => {
  if (typeof value === 'string') {
    try {
      if (!value || value === 'null' || value === 'undefined') return fallback;
      return JSON.parse(value);
    } catch (e) {
      console.warn('Failed to parse JSON:', value, e);
      // Not a JSON string, return as array with the string or fallback
      return value ? [value] : fallback;
    }
  }
  if (Array.isArray(value)) return value;
  return fallback;
};

const TenantDashboard = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [mapboxToken, setMapboxToken] = useState<string>(import.meta.env.VITE_MAPBOX_TOKEN || '');
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    profilePhoto: '',
  });
  const location = useLocation();
  const [viewings, setViewings] = useState([]);
  const [loadingViewings, setLoadingViewings] = useState(true);

  // Lease notification state for matches tab
  const [hasNewLease, setHasNewLease] = useState(false);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [lastNotificationFetch, setLastNotificationFetch] = useState(0);
  const [notificationRetryCount, setNotificationRetryCount] = useState(0);

  // Add notification settings state
  const [viewingRequestNotifications, setViewingRequestNotifications] = useState(true);

  // Add tenant preferences state
  const [tenantPreferences, setTenantPreferences] = useState({
    preferredHouseTypes: [] as string[],
    preferredRentMin: undefined as number | undefined,
    preferredRentMax: undefined as number | undefined,
    preferredDistance: undefined as number | undefined,
    address: '',
  });

  // Add tenant coordinates state
  const [tenantCoordinates, setTenantCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [geocodingComplete, setGeocodingComplete] = useState(false);

  // Debug: Log current user info
  useEffect(() => {
    console.log('🔍 Current user info:', {
      id: user?.id,
      email: user?.email,
      role: user?.user_metadata?.role
    });
  }, [user]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchTenantPreferences();
  }, [user]);

  useEffect(() => {
    if (location.state && location.state.profileUpdated) {
      fetchProfile();
      // Clear the state so it doesn't refetch on every render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state && location.state.leaseSigned) {
      setHasNewLease(false);
      // Clear the state so it doesn't refetch on every render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
      // Refresh all notifications when component comes into focus
      if (user?.id) {
        // Debounce: only fetch if it's been more than 2 seconds since last fetch
        const now = Date.now();
        if (now - lastNotificationFetch < 2000) {
          console.log('Skipping notification refresh - too soon since last fetch');
          return;
        }
        
        // Add a timeout to prevent infinite loading state
        const timeoutId = setTimeout(() => {
          setNotificationsLoading(false);
          // Retry the notification fetch after timeout if we haven't exceeded retry limit
          if (notificationRetryCount < 2) {
            console.log('Retrying notification fetch after timeout');
            setTimeout(() => fetchNotificationsWithRetry(true), 1000);
          }
        }, 2000); // 2 second timeout

        fetchNotificationsWithRetry().finally(() => {
          clearTimeout(timeoutId);
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, lastNotificationFetch, notificationRetryCount]);

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      }
    };
    window.addEventListener('tenantProfileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('tenantProfileUpdated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const fetchViewings = async () => {
    if (!user) return;
    console.log('🔄 Fetching viewing requests for tenant:', user.id);
    setLoadingViewings(true);
    try {
      // Fetch all requests for this tenant with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await apiFetch(`${getApiBaseUrl()}/api/viewings/tenant?tenantId=${user.id}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('📡 Viewing requests response:', res);
      setViewings(res);
    } catch (err) {
      console.error('❌ Error fetching viewing requests:', err);
      setViewings([]);
    } finally {
      setLoadingViewings(false);
    }
  };

  useEffect(() => {
    fetchViewings();
  }, [user]);

  // Function to fetch notifications with retry logic
  const fetchNotificationsWithRetry = async (isRetry = false) => {
    if (!user?.id) return;
    
    if (isRetry) {
      setNotificationRetryCount(prev => prev + 1);
    }
    
    setNotificationsLoading(true);
    setLastNotificationFetch(Date.now());
    
    try {
      console.log(`Fetching notification summary for tenant: ${user.id}${isRetry ? ' (retry)' : ''}`);
      const response = await getNotificationSummary(user.id, 'tenant');
      
      if (response?.data) {
        const { unreadMessages, pendingMaintenance, newLeases, pendingViewings } = response.data;
        
        setUnreadMessageCount(unreadMessages || 0);
        
        // Check for unsigned leases
        const unsignedLease = newLeases?.find((lease: any) => lease.signed === false);
        setHasNewLease(!!unsignedLease);
        setLeaseId(unsignedLease?.id || null);
        
        console.log('Notification summary loaded for tenant:', response.data);
        setNotificationRetryCount(0); // Reset retry count on success
      }
    } catch (error) {
      console.error('Error fetching notification summary:', error);
      setUnreadMessageCount(0);
      setHasNewLease(false);
      setLeaseId(null);
      
      // Auto-retry on error if we haven't exceeded retry limit
      if (!isRetry && notificationRetryCount < 2) {
        console.log('Auto-retrying notification fetch due to error');
        setTimeout(() => fetchNotificationsWithRetry(true), 1000);
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    // Check for all notifications to show notification badges
    fetchNotificationsWithRetry();
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`${getApiBaseUrl()}/api/listings`);
      if (response.success) {
        // Transform the API response to match our Property interface
        const transformedProperties = response.data.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          address: listing.address,
          city: listing.city,
          state: listing.state,
          zip_code: listing.zip_code,
          price: listing.price,
          type: listing.type.toLowerCase(),
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          area: listing.area,
          images: parseMaybeJson(listing.images, []),
          description: listing.description,
          amenities: parseMaybeJson(listing.amenities, []),
          landlord_id: listing.landlord_id,
          landlord_name: listing.landlord_name,
          landlord_phone: listing.landlord_phone,
          coordinates: (() => {
            try {
              if (!listing.coordinates || listing.coordinates === 'null') return null;
              if (typeof listing.coordinates === 'string') {
                // Check if it's a JSON string first
                if (listing.coordinates.trim().startsWith('{')) {
                  return JSON.parse(listing.coordinates);
                }
                // If it's a comma-separated string like "lat,lng"
                const coords = listing.coordinates.split(',');
                if (coords.length === 2) {
                  return { lat: parseFloat(coords[0].trim()), lng: parseFloat(coords[1].trim()) };
                }
                const parsed = JSON.parse(listing.coordinates);
                // Validate that we have valid lat/lng values
                if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && 
                    parsed.lat !== 0 && parsed.lng !== 0) {
                  return parsed;
                }
                return null;
              }
              // Validate that we have valid lat/lng values
              if (listing.coordinates && typeof listing.coordinates.lat === 'number' && 
                  typeof listing.coordinates.lng === 'number' && 
                  listing.coordinates.lat !== 0 && listing.coordinates.lng !== 0) {
                return listing.coordinates;
              }
              return null;
            } catch (e) {
              console.warn('Failed to parse coordinates:', listing.coordinates, e);
              return null;
            }
          })(),
          available: listing.available,
          lease_type: listing.lease_type,
          requirements: parseMaybeJson(listing.requirements, []),
          house_rules: parseMaybeJson(listing.house_rules, []),
        }));
        
        // Debug: Log property coordinates
        console.log('🔍 Loaded properties with coordinates:');
        transformedProperties.forEach(prop => {
          console.log(`${prop.address}: coordinates =`, prop.coordinates);
        });
        
        setProperties(transformedProperties);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch properties. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      console.log('Fetching tenant profile for user ID:', user.id);
      const response = await apiFetch(`${getApiBaseUrl()}/api/tenants/${user.id}`);
      console.log('Tenant profile response:', response);
      if (response.success && response.data) {
        const data = response.data;
        console.log('Tenant profile data:', data);
        setProfile({
          fullName: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.address || '',
          profilePhoto: data.image_url || '',
        });
        // Set notification settings
        setViewingRequestNotifications(data.viewingRequestNotifications ?? true);
      }
    } catch (err) {
      console.error('Error fetching tenant profile:', err);
    }
  };

  const fetchTenantPreferences = async () => {
    if (!user) return;
    try {
      console.log('🔍 Fetching tenant preferences for user:', user.id);
      // Fetch from main tenant profile instead of separate preferences endpoint
      const response = await tenantApi.getById(user.id);
      console.log('📡 Tenant profile API response:', response);
      
      if (response.success && response.data) {
        const data = response.data.data; // Note: nested data structure
        console.log('📊 Raw tenant profile data:', data);
        
        setTenantPreferences({
          preferredHouseTypes: data.preferredHouseTypes || [],
          preferredRentMin: data.preferredRentMin,
          preferredRentMax: data.preferredRentMax,
          preferredDistance: data.preferredDistance,
          address: data.address || '',
        });
        console.log('✅ Tenant preferences loaded:', {
          preferredHouseTypes: data.preferredHouseTypes || [],
          preferredRentMin: data.preferredRentMin,
          preferredRentMax: data.preferredRentMax,
          preferredDistance: data.preferredDistance,
          address: data.address || '',
        });

        // Geocode the tenant's address if available
        if (data.address && data.preferredDistance !== undefined) {
          console.log('🌍 Geocoding tenant address:', data.address);
          const coords = await geocodeAddress(data.address);
          setTenantCoordinates(coords);
          setGeocodingComplete(true);
          console.log('📍 Tenant coordinates:', coords);
          
          if (!coords) {
            toast({
              title: "Geocoding Failed",
              description: `Could not find coordinates for address: ${data.address}. Distance filtering will be disabled.`,
              variant: "destructive",
            });
          } else {
            console.log(`✅ Successfully geocoded ${data.address} to:`, coords);
          }
        } else {
          console.log('⚠️ No address or distance preference set, skipping geocoding');
          setGeocodingComplete(true);
        }
      } else {
        console.log('❌ Preferences API call failed:', response);
      }
    } catch (err) {
      console.error('❌ Error fetching tenant preferences:', err);
    }
  };

  // Debug: Log current filter states
  console.log('🔍 Current filter states:', {
    totalProperties: properties.length,
    searchTerm,
    selectedType,
    priceRange,
    tenantPreferences,
    geocodingComplete,
    tenantCoordinates
  });

  const filteredProperties = properties.filter(property => {
    console.log(`🔍 Filtering property: ${property.title} (${property.type}) - $${property.price}`);
    
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());

    // Use tenant preferences for filtering
    let matchesType = true;
    let matchesPrice = true;
    let matchesDistance = true;

    // House type filtering
    if (tenantPreferences.preferredHouseTypes.length > 0) {
      matchesType = tenantPreferences.preferredHouseTypes.includes(property.type);
      console.log(`🏠 House type filter: ${property.type} in [${tenantPreferences.preferredHouseTypes.join(', ')}] = ${matchesType}`);
    } else {
      // Fallback to manual filter if no preferences set
      matchesType = selectedType === 'all' || property.type === selectedType;
      console.log(`🏠 Manual type filter: ${property.type} matches '${selectedType}' = ${matchesType}`);
    }

    // Rent range filtering
    if (tenantPreferences.preferredRentMin !== undefined && tenantPreferences.preferredRentMin !== null) {
      matchesPrice = property.price >= tenantPreferences.preferredRentMin;
      console.log(`💰 Min price filter: $${property.price} >= $${tenantPreferences.preferredRentMin} = ${matchesPrice}`);
    }
    if (tenantPreferences.preferredRentMax !== undefined && tenantPreferences.preferredRentMax !== null) {
      matchesPrice = matchesPrice && property.price <= tenantPreferences.preferredRentMax;
      console.log(`💰 Max price filter: $${property.price} <= $${tenantPreferences.preferredRentMax} = ${matchesPrice}`);
    }
    
    // If no preferences set, use manual price filter
    if ((tenantPreferences.preferredRentMin === undefined || tenantPreferences.preferredRentMin === null) && 
        (tenantPreferences.preferredRentMax === undefined || tenantPreferences.preferredRentMax === null)) {
      if (priceRange === 'under-2000') matchesPrice = property.price < 2000;
      else if (priceRange === '2000-4000') matchesPrice = property.price >= 2000 && property.price <= 4000;
      else if (priceRange === 'over-4000') matchesPrice = property.price > 4000;
      console.log(`💰 Manual price filter: $${property.price} in range '${priceRange}' = ${matchesPrice}`);
    }

    // Distance filtering
    if (tenantPreferences.preferredDistance !== undefined && tenantPreferences.preferredDistance !== null && geocodingComplete) {
      console.log(`🌍 Distance filtering enabled: ${tenantPreferences.preferredDistance} miles from ${tenantPreferences.address}`);
      console.log(`📍 Tenant coordinates:`, tenantCoordinates);
      console.log(`📍 Property coordinates:`, property.coordinates);
      
      if (tenantCoordinates && property.coordinates && property.coordinates.lat && property.coordinates.lng) {
        const distance = calculateDistance(
          tenantCoordinates.lat,
          tenantCoordinates.lon,
          property.coordinates.lat,
          property.coordinates.lng
        );
        console.log(`📏 Distance from ${tenantPreferences.address} to ${property.address}: ${distance} miles (max: ${tenantPreferences.preferredDistance})`);
        matchesDistance = distance <= tenantPreferences.preferredDistance;
        console.log(`🌍 Property ${property.address} distance match:`, matchesDistance);
      } else {
        // If property doesn't have valid coordinates, filter it out when distance filtering is enabled
        console.log(`❌ Property ${property.address} has no valid coordinates, filtering it out due to distance preference`);
        matchesDistance = false;
      }
    } else if (tenantPreferences.preferredDistance !== undefined && tenantPreferences.preferredDistance !== null && !geocodingComplete) {
      console.log('⏳ Geocoding in progress, allowing all properties through temporarily');
      matchesDistance = true;
    } else {
      console.log('🌍 Distance filtering not enabled');
    }

    const finalResult = matchesSearch && matchesType && matchesPrice && matchesDistance;
    console.log(`✅ Property ${property.title} final result: ${finalResult} (search: ${matchesSearch}, type: ${matchesType}, price: ${matchesPrice}, distance: ${matchesDistance})`);
    
    // TEMPORARY: Show all properties for debugging
    // return true;
    
    return finalResult;
  });

  // Debug: Log properties info
  console.log('Total properties:', properties.length);
  console.log('Filtered properties:', filteredProperties.length);
  console.log('Properties with coordinates:', properties.filter(p => p.coordinates && p.coordinates.lat && p.coordinates.lng).length);

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  // Filter requests: show all except 'Closed', but always show 'Approved' as reminders
  const approvedRequests = viewings.filter(v => v.status === 'Approved');
  const otherRequests = viewings.filter(v => v.status !== 'Closed' && v.status !== 'Approved');

  // Helper to format date safely
  const formatDateSafe = (dateString: string) => {
    if (!dateString) return 'Not set';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-roomzi-blue">Room<span className="text-yellow-500">zi</span></h1>
              <Badge className="ml-3 bg-green-100 text-green-800">Tenant</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
                className="hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Tenant Profile Info */}
        {/* REMOVE the profile card at the top (Card with profile info) */}

        {/* Enhanced Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, {profile.fullName || 'Tenant'}!</h2>
            <p className="text-gray-600">Find your perfect home with our enhanced search and map view</p>
          </div>
        </div>

        {/* Viewing Requests Section - Only show if notifications are enabled */}
        {viewingRequestNotifications && (
          <Card className="p-6 mb-6 shadow-lg bg-white/80 backdrop-blur-sm border-0">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-500" />
              Viewing Requests
            </h2>
            {loadingViewings ? (
              <div className="text-gray-500">Loading...</div>
            ) : viewings.length === 0 ? (
              <div className="text-gray-500">No viewing requests yet.</div>
            ) : (
              <div className="space-y-4">
                {/* Approved requests as reminders */}
                {approvedRequests.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                    <div>
                      <div className="font-medium">{v.listings?.title || 'Property'}</div>
                      <div className="text-sm text-gray-600">
                        Requested: {formatDateSafe(v.requestedDateTime)}
                      </div>
                      <div className="text-xs text-blue-700">
                        Proposed: {v.proposedDateTime ? formatDateSafe(v.proposedDateTime) : 'Not set'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Approved</span>
                    </div>
                  </div>
                ))}
                {/* Other requests */}
                {otherRequests.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div>
                      <div className="font-medium">{v.listings?.title || 'Property'}</div>
                      <div className="text-sm text-gray-600">
                        Requested: {formatDateSafe(v.requestedDateTime)}
                      </div>
                      <div className="text-xs text-blue-700">
                        Proposed: {v.proposedDateTime ? formatDateSafe(v.proposedDateTime) : 'Not set'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                      {v.status === 'Declined' && <XCircle className="w-4 h-4 text-red-500" />}
                      {v.status === 'Proposed' && <Clock className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm font-semibold ${v.status === 'Pending' ? 'text-yellow-600' : v.status === 'Declined' ? 'text-red-600' : v.status === 'Proposed' ? 'text-blue-700' : 'text-gray-500'}`}>{v.status}</span>
                    </div>
                    {v.status === 'Proposed' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={async () => {
                          await apiFetch(`${getApiBaseUrl()}/api/viewings/${v.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Approved' }) });
                          fetchViewings();
                        }}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          await apiFetch(`${getApiBaseUrl()}/api/viewings/${v.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Declined' }) });
                          fetchViewings();
                        }}>Decline</Button>
                      </div>
                    )}
                    {v.status !== 'Closed' && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        await apiFetch(`${getApiBaseUrl()}/api/viewings/${v.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Closed' }) });
                        fetchViewings();
                      }}>Close Request</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Enhanced Search and Filters */}
        <Card className="p-6 mb-6 shadow-lg bg-white/80 backdrop-blur-sm border-0">

          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by location, property name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={tenantPreferences.preferredHouseTypes.length > 0}
                className={`px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px] hover:border-blue-300 transition-colors ${
                  tenantPreferences.preferredHouseTypes.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="all">All Types</option>
                <option value="room">Room</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
              </select>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                disabled={tenantPreferences.preferredRentMin !== undefined || tenantPreferences.preferredRentMax !== undefined}
                className={`px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px] hover:border-blue-300 transition-colors ${
                  (tenantPreferences.preferredRentMin !== undefined || tenantPreferences.preferredRentMax !== undefined) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="all">All Prices</option>
                <option value="under-2000">Under $2,000</option>
                <option value="2000-4000">$2,000 - $4,000</option>
                <option value="over-4000">Over $4,000</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid className="w-4 h-4" />
                Grid View
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex items-center gap-2"
              >
                <MapIcon className="w-4 h-4" />
                Map View
              </Button>
            </div>
            <p className="text-gray-600 text-sm">
              {filteredProperties.length} of {properties.length} properties
            </p>
          </div>
        </Card>

        {/* Content Area */}
        {viewMode === 'map' ? (
          <Card className="h-[70vh] overflow-hidden shadow-lg">
            <Map 
              properties={filteredProperties} 
              onPropertyClick={handlePropertyClick}
              mapboxToken={mapboxToken}
              onTokenSubmit={setMapboxToken}
              showUserLocation={true}
            />
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          </div>
        ) : filteredProperties.length > 0 ? (
          /* Enhanced Properties Grid */
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] bg-white border-0 shadow-lg group"
                onClick={() => handlePropertyClick(property.id)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700 capitalize backdrop-blur-sm">
                      {property.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 text-blue-500" />
                    <span className="text-sm line-clamp-1">{property.address}, {property.city}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <Home className="w-4 h-4 mr-2 shrink-0 text-blue-500" />
                    <span className="text-sm">
                      {property.bedrooms} bed • {property.bathrooms} bath • {property.area} sq ft
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${property.price.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-500 mb-4">
              <Home className="w-20 h-20 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No properties found</h3>
              <p className="text-gray-400">Try adjusting your search criteria or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 text-roomzi-blue"
            onClick={() => navigate('/tenant')}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Browse</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 hover:bg-blue-50 relative"
            onClick={() => navigate('/tenant/matches')}
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Matches</span>
            {notificationsLoading ? (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                <div className="w-2 h-2 bg-current rounded-full animate-spin"></div>
              </span>
            ) : (
              <>
                {hasNewLease && (
                  <span className="absolute -top-1 -left-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse">
                    📄
                  </span>
                )}
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse min-w-[18px] text-center">
                    {unreadMessageCount}
                  </span>
                )}
                {notificationRetryCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-orange-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchNotificationsWithRetry(true);
                    }}
                    title="Click to retry loading notifications"
                  >
                    🔄
                  </span>
                )}
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2"
            onClick={() => navigate('/tenant/my-house')}
          >
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-xs">My House</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2"
            onClick={() => navigate('/tenant/profile')}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default TenantDashboard;
