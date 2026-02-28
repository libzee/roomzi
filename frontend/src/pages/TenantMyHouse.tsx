import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Home, Calendar, DollarSign, User, Phone, Mail, MapPin, CreditCard, X } from 'lucide-react';
import { useState as useReactState, useEffect as useReactEffect } from 'react';
import { getLeaseHistoryForTenantAndListing, getListingById, getLeasesForTenant } from '@/utils/api';
import { ChatWindow } from '@/components/chat/ChatWindow';

const TenantMyHouse = () => {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const { user } = useAuth();
  const tenantId = user?.id;
  const [hasRental, setHasRental] = useState(false);
  const [currentRental, setCurrentRental] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useReactState(false);
  const [leaseHistory, setLeaseHistory] = useReactState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useReactState(false);
  const [historyError, setHistoryError] = useReactState<string | null>(null);
  const [rentalStatus, setRentalStatus] = useState<string>('Unknown');
  const [leaseInfo, setLeaseInfo] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<{
    propertyTitle: string;
    propertyImage: string;
    landlordName: string;
    landlordId: string;
    propertyId: string;
    chatRoomId: string;
  } | null>(null);

  // Function to determine rental status based on lease information
  const determineRentalStatus = (lease: any, listing: any) => {
    if (!lease) {
      return { status: 'No Lease', color: 'bg-gray-100 text-gray-800' };
    }

    if (!lease.signed) {
      return { status: 'Lease Pending', color: 'bg-yellow-100 text-yellow-800' };
    }

    const now = new Date();
    const startDate = lease.start_date ? new Date(lease.start_date) : null;
    const endDate = lease.end_date ? new Date(lease.end_date) : null;

    if (!startDate || !endDate) {
      return { status: 'Lease Active', color: 'bg-green-100 text-green-800' };
    }

    if (now < startDate) {
      return { status: 'Lease Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'Active Rental', color: 'bg-green-100 text-green-800' };
    } else if (now > endDate) {
      return { status: 'Lease Expired', color: 'bg-red-100 text-red-800' };
    }

    return { status: 'Lease Active', color: 'bg-green-100 text-green-800' };
  };

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    
    const fetchRentalData = async () => {
      try {
        let rental: any = null;
        
        if (listingId) {
          // Fetch specific listing by ID
          const response = await getListingById(listingId);
          if (response.success && response.data) {
            rental = response.data;
          }
        } else {
          // Fetch current rental (original behavior)
          const response = await fetch(`http://localhost:3001/api/tenants/${tenantId}/listings`);
          const data = await response.json();
          
          if (data.success && data.data && data.data.length > 0) {
            // Find the property where available === false (rented)
            rental = data.data.find((listing: any) => listing.available === false);
          }
        }

        if (rental) {
          setCurrentRental({
            id: rental.id,
            propertyTitle: rental.title || "Property",
            address: `${rental.address}, ${rental.city}, ${rental.state}`,
            landlordName: rental.landlord_name || "Landlord",
            landlordId: rental.landlord_id || rental.landlordId,
            landlordPhone: rental.landlord_phone || rental.landlordPhone || "N/A",
            landlordEmail: rental.landlord_email || rental.landlordEmail || "N/A",
            rent: rental.price || 0,
            leaseStart: rental.lease_start || "N/A",
            leaseEnd: rental.lease_end || "N/A",
            image: rental.images ? (Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]) : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
          });
          setHasRental(true);

          // Fetch lease information for this property
          try {
            const leaseResponse = await getLeasesForTenant(tenantId);
            if (leaseResponse.success && Array.isArray(leaseResponse.data)) {
              // Find lease for this specific property
              const propertyLease = leaseResponse.data.find((lease: any) => 
                lease.listing_id === rental.id || lease.listing_id === rental.id.toString()
              );
              setLeaseInfo(propertyLease || null);
              
              // Determine rental status
              const statusInfo = determineRentalStatus(propertyLease, rental);
              setRentalStatus(statusInfo.status);
            }
          } catch (leaseErr) {
            console.error('Error fetching lease info:', leaseErr);
            setLeaseInfo(null);
            setRentalStatus('Unknown');
          }
        } else {
          setHasRental(false);
          setCurrentRental(null);
          setLeaseInfo(null);
          setRentalStatus('Unknown');
        }
      } catch (err) {
        console.error('Error fetching rental data:', err);
        setHasRental(false);
        setCurrentRental(null);
        setLeaseInfo(null);
        setRentalStatus('Unknown');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRentalData();
  }, [tenantId, listingId]);

  useReactEffect(() => {
    const fetchHistory = async () => {
      if (showHistory && tenantId && currentRental?.id) {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
          const res = await getLeaseHistoryForTenantAndListing(tenantId, currentRental.id);
          if (res.success && Array.isArray(res.data)) {
            setLeaseHistory(res.data);
          } else {
            setHistoryError('Failed to fetch lease history.');
          }
        } catch (err) {
          setHistoryError('Failed to fetch lease history.');
        } finally {
          setHistoryLoading(false);
        }
      }
    };
    fetchHistory();
  }, [showHistory, tenantId, currentRental]);



  const handleSendMessage = () => {
    if (currentRental) {
      setSelectedChat({
        propertyTitle: currentRental.propertyTitle,
        propertyImage: currentRental.image,
        landlordName: currentRental.landlordName,
        landlordId: currentRental.landlordId,
        propertyId: currentRental.id,
        chatRoomId: '', // Will be created by ChatWindow
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => listingId ? navigate('/tenant/my-house') : navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">
                {listingId ? 'Property Details' : 'My House'}
              </h1>
            </div>
            {hasRental && (
              <Badge className={determineRentalStatus(leaseInfo, currentRental).color}>
                {rentalStatus}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading state
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-gray-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
            <p className="text-gray-600">
              {listingId ? 'Fetching property details...' : 'Fetching your rental information'}
            </p>
          </div>
        ) : !hasRental ? (
          // Empty state when no rental
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {listingId ? 'Property Not Found' : 'No Current Rental'}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {listingId 
                ? 'The requested property could not be found or you may not have access to it.'
                : 'When you find and rent a property, all the details will appear here. Start browsing to find your perfect home!'
              }
            </p>
            <Button onClick={() => navigate(listingId ? '/tenant/my-house' : '/tenant')} className="roomzi-gradient">
              {listingId ? 'Back to My Properties' : 'Browse Properties'}
            </Button>
          </div>
        ) : (
          // Active rental details
          <div className="space-y-6">
            {/* Property Overview */}
            <Card className="overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img
                  src={currentRental.image}
                  alt={currentRental.propertyTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentRental.propertyTitle}
                    </h2>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {currentRental.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-roomzi-blue">
                      ${currentRental.rent.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lease Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Lease Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Start Date
                  </label>
                  <p className="text-gray-900">{currentRental.leaseStart}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease End Date
                  </label>
                  <p className="text-gray-900">{currentRental.leaseEnd}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent
                  </label>
                  <p className="text-gray-900">${currentRental.rent.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease History
                  </label>
                  <Button size="sm" variant="outline" onClick={() => setShowHistory(true)}>
                    View Lease History
                  </Button>
                </div>
              </div>
            </Card>
            {showHistory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <Card className="p-6 max-w-lg w-full relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowHistory(false)}>&times;</button>
                  <h4 className="text-lg font-bold mb-4">Lease History</h4>
                  {historyLoading ? (
                    <div className="text-gray-500">Loading lease history...</div>
                  ) : historyError ? (
                    <div className="text-red-500">{historyError}</div>
                  ) : leaseHistory.length === 0 ? (
                    <div className="text-gray-500">No lease history found for this property.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-2 pr-4">Start Date</th>
                            <th className="py-2 pr-4">End Date</th>
                            <th className="py-2 pr-4">Rent</th>
                            <th className="py-2 pr-4">Signed</th>
                            <th className="py-2 pr-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaseHistory.map((lease) => {
                            const now = new Date();
                            const startDate = lease.start_date ? new Date(lease.start_date) : null;
                            const endDate = lease.end_date ? new Date(lease.end_date) : null;
                            
                            let isActive = false;
                            if (startDate && endDate) {
                              isActive = now >= startDate && now <= endDate;
                            } else if (startDate && !endDate) {
                              isActive = now >= startDate;
                            }
                            
                            return (
                              <tr key={lease.id} className="border-b last:border-0">
                                <td className="py-2 pr-4">{lease.start_date ? lease.start_date.slice(0, 10) : '-'}</td>
                                <td className="py-2 pr-4">{lease.end_date ? lease.end_date.slice(0, 10) : '-'}</td>
                                <td className="py-2 pr-4">${lease.rent}</td>
                                <td className="py-2 pr-4">{lease.signed ? 'Yes' : 'No'}</td>
                                <td className="py-2 pr-4">
                                  <Badge 
                                    variant={isActive ? "default" : "secondary"}
                                    className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                                  >
                                    {isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Landlord Contact */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Landlord Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="font-medium">{currentRental.landlordName}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-gray-500" />
                  <span>{currentRental.landlordPhone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-500" />
                  <span>{currentRental.landlordEmail}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="roomzi-gradient" onClick={handleSendMessage}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" onClick={() => navigate(`/tenant/maintenance/${currentRental.id}`)}>
                  <Home className="w-4 h-4 mr-2" />
                  Maintenance Request
                </Button>
                <Button variant="outline" className="justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Inspection
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate(`/tenant/renew-lease/${currentRental.id}`)}>
                  <User className="w-4 h-4 mr-2" />
                  Lease Renewal
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/tenant/financial-account')}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Financial Account
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {selectedChat && (
        <div className="fixed bottom-4 right-4 z-50 w-[350px] h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]">
          <div className="relative h-full flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100"
              onClick={() => setSelectedChat(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex-1 min-h-0">
              <ChatWindow
                propertyTitle={selectedChat.propertyTitle}
                propertyImage={selectedChat.propertyImage}
                landlordName={selectedChat.landlordName}
                landlordId={selectedChat.landlordId}
                propertyId={selectedChat.propertyId}
                chatRoomId={selectedChat.chatRoomId}
                isFullPage={false}
                onClose={() => setSelectedChat(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantMyHouse;
