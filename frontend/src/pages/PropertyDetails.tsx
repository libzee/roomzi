import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, User, ArrowLeft, Settings, MessageCircle } from 'lucide-react';
import { sampleProperties } from '@/data/sampleProperties';
import Map from '@/components/Map';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

// Helper to safely parse images field
function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed;
      return [images];
    } catch {
      return [images];
    }
  }
  return [];
}

// Helper to safely parse array-like fields (requirements, amenities, houseRules)
function parseArrayField(field) {
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
      if (field.includes(',')) return field.split(',').map(s => s.trim());
      return [field];
    } catch {
      if (field.includes(',')) return field.split(',').map(s => s.trim());
      return [field];
    }
  }
  return [];
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapboxToken, setMapboxToken] = useState<string>(import.meta.env.VITE_MAPBOX_TOKEN || '');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`${getApiBaseUrl()}/api/listings/${id}`);
        if (response.success) {
          const data = response.data;
          setProperty({
            ...data,
            house_rules: data.house_rules,
            landlord_name: data.landlord_name,
            landlord_phone: data.landlord_phone,
            landlord_id: data.landlord_id,
            zip_code: data.zip_code,
            lease_type: data.lease_type,
            images: data.images,
            amenities: data.amenities,
            requirements: data.requirements,
            coordinates: (() => {
              try {
                if (!data.coordinates || data.coordinates === 'null') return { lat: 0, lng: 0 };
                if (typeof data.coordinates === 'string') {
                  // Check if it's a JSON string first
                  if (data.coordinates.trim().startsWith('{')) {
                    return JSON.parse(data.coordinates);
                  }
                  // If it's a comma-separated string like "lat,lng"
                  const coords = data.coordinates.split(',');
                  if (coords.length === 2) {
                    return { lat: parseFloat(coords[0].trim()), lng: parseFloat(coords[1].trim()) };
                  }
                }
                return data.coordinates;
              } catch (e) {
                console.warn('Failed to parse coordinates:', data.coordinates, e);
                return { lat: 0, lng: 0 };
              }
            })(),
            // Add more mappings as needed
          });
        } else {
          setProperty(null);
        }
      } catch (error) {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!property) return <div>Property not found</div>;

  const images = parseImages(property.images);
  const requirements = parseArrayField(property.requirements);
  const amenities = parseArrayField(property.amenities);
  const houseRules = parseArrayField(property.house_rules);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/tenant')}
              className="flex items-center hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Room<span className="text-yellow-500">zi</span>
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Image Gallery */}
        <div className="mb-8">
          <div className="aspect-[16/10] rounded-xl overflow-hidden mb-4 shadow-lg">
            <img
              src={images[currentImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === index 
                    ? 'border-blue-500 shadow-md scale-105' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <img
                  src={image}
                  alt={`${property.title} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Property Info Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                <Badge variant="secondary" className="text-lg px-4 py-2 capitalize bg-blue-100 text-blue-700">
                  {property.type}
                </Badge>
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                <span className="text-lg">{property.address}, {property.city}, {property.state} {property.zip_code}</span>
              </div>

              <div className="flex items-center text-gray-600 mb-6">
                <Home className="w-5 h-5 mr-2 text-blue-500" />
                <span className="text-lg">
                  {property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''} • 
                  {property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''} • 
                  {property.area} sq ft
                </span>
              </div>

              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                ${property.price.toLocaleString()}
                <span className="text-xl font-normal text-gray-500">/month</span>
              </div>
            </div>

            {/* Description */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Description</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
            </Card>

            {/* Amenities */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center p-2 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Requirements */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Tenant Requirements</h2>
              <div className="space-y-3">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center p-2 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">{requirement}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* House Rules */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">House Rules</h2>
              <div className="space-y-3">
                {houseRules.map((rule, index) => (
                  <div key={index} className="flex items-center p-2 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">{rule}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <Card className="p-6 sticky top-24 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Contact Landlord</h3>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                                  <p className="font-medium text-gray-900">{property.landlord_name}</p>
                <p className="text-sm text-gray-600">{property.landlord_phone}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                  onClick={() => setIsChatOpen(true)}
                >
                  Send Message
                </Button>
                <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200" onClick={() => setIsScheduleModalOpen(true)}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Viewing
                </Button>

              </div>
            </Card>

            {/* Chat Dialog */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
              <DialogContent className="max-w-2xl h-[80vh] p-0">
                <ChatWindow 
                  propertyTitle={property.title}
                  propertyImage={images[0]}
                                landlordName={property.landlord_name}
              landlordId={property.landlord_id}
                  chatRoomId={undefined}
                  propertyId={property.id}
                />
              </DialogContent>
            </Dialog>

            {/* Enhanced Map */}
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Location</h3>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Map 
                  properties={[property]} 
                  onPropertyClick={() => {}}
                  mapboxToken={mapboxToken}
                  onTokenSubmit={setMapboxToken}
                  showUserLocation={true}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2 shadow-xl">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-blue-50" onClick={() => navigate('/tenant')}>
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Browse</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-blue-50">
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-xs">Map</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-blue-50" onClick={() => navigate('/tenant/matches')}>
            <MessageCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Matches</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-blue-50" onClick={() => navigate('/tenant/profile')}>
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Schedule a Viewing</DialogTitle>
          <DialogDescription>Select a date and time for your viewing request.</DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Time</label>
              <input
                type="time"
                className="border rounded px-3 py-2 w-full"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!selectedDate || !selectedTime}
              onClick={async () => {
                if (!selectedDate || !selectedTime) return;
                try {
                  // Combine date and time into ISO string
                  const [hours, minutes] = selectedTime.split(':');
                  const dateTime = new Date(selectedDate);
                  dateTime.setHours(Number(hours));
                  dateTime.setMinutes(Number(minutes));
                  // Debug log
                  console.log('Scheduling viewing:', {
                    propertyId: property.id,
                    tenantId: user.id,
                    landlordId: property.landlordId,
                    requestedDateTime: dateTime.toISOString(),
                    selectedDate,
                    selectedTime,
                    dateTime,
                  });
                  // Prepare payload
                  await apiFetch(`${getApiBaseUrl()}/api/viewings`, {
                    method: 'POST',
                    body: JSON.stringify({
                      propertyId: property.id,
                      tenantId: user.id,
                      landlordId: property.landlordId,
                      requestedDateTime: dateTime.toISOString(),
                    }),
                  });
                  setIsScheduleModalOpen(false);
                  toast({ title: 'Viewing request submitted!', description: `Requested for ${format(selectedDate, 'PPP')} at ${selectedTime}` });
                } catch (err) {
                  toast({ title: 'Error', description: 'Failed to submit viewing request', variant: 'destructive' });
                }
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetails;
