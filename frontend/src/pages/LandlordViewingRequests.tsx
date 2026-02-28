import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, User, MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getApiBaseUrl } from '@/utils/api';

interface ViewingRequest {
  id: number;
  propertyId: number;
  tenantId: string;
  landlordId: string;
  requestedDateTime: string;
  status: 'Pending' | 'Approved' | 'Declined';
  createdAt: string;
  updatedAt: string;
  listing: {
    id: number;
    title: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    price: number;
    images: string;
  };
  tenant: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

const LandlordViewingRequests = () => {
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchViewingRequests = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await apiFetch(`${getApiBaseUrl()}/api/viewings?landlordId=${user.id}`);
        setViewingRequests(response);
      } catch (error) {
        console.error('Failed to fetch viewing requests:', error);
        setViewingRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViewingRequests();
  }, [user]);

  const handleStatusUpdate = async (requestId: number, status: 'Approved' | 'Declined') => {
    if (!user) return;
    
    setUpdatingId(requestId);
    try {
      await apiFetch(`${getApiBaseUrl()}/api/viewings/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      // Update the local state
      setViewingRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status, updatedAt: new Date().toISOString() }
            : request
        )
      );
    } catch (error) {
      console.error('Failed to update viewing request:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = viewingRequests.filter(req => req.status === 'Pending');
  const otherRequests = viewingRequests.filter(req => req.status !== 'Pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/landlord')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Viewing Requests</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 mb-1">Pending Requests</p>
                <p className="text-3xl font-bold">{pendingRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Approved</p>
                <p className="text-3xl font-bold">
                  {viewingRequests.filter(req => req.status === 'Approved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 mb-1">Declined</p>
                <p className="text-3xl font-bold">
                  {viewingRequests.filter(req => req.status === 'Declined').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading viewing requests...</p>
            </div>
          </div>
        ) : viewingRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No viewing requests</h3>
            <p className="text-gray-600">You haven't received any viewing requests yet.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                  Pending Requests ({pendingRequests.length})
                </h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="p-6 border-l-4 border-l-yellow-500">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.listing.title}
                              </h3>
                              <div className="flex items-center text-gray-600 mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">
                                  {request.listing.address}, {request.listing.city}
                                </span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{request.status}</span>
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                Tenant Details
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Name:</strong> {request.tenant.full_name}</p>
                                <p><strong>Email:</strong> {request.tenant.email}</p>
                                {request.tenant.phone && (
                                  <p><strong>Phone:</strong> {request.tenant.phone}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Home className="w-4 h-4 mr-2" />
                                Property Details
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Type:</strong> {request.listing.bedrooms} bed, {request.listing.bathrooms} bath</p>
                                <p><strong>Area:</strong> {request.listing.area} sq ft</p>
                                <p><strong>Price:</strong> ${request.listing.price}/month</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Requested Viewing Time
                            </h4>
                            <p className="text-sm text-gray-700">
                              {formatDateTime(request.requestedDateTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button
                            onClick={() => handleStatusUpdate(request.id, 'Approved')}
                            disabled={updatingId === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {updatingId === request.id ? 'Updating...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(request.id, 'Declined')}
                            disabled={updatingId === request.id}
                            variant="destructive"
                          >
                            {updatingId === request.id ? 'Updating...' : 'Decline'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Other Requests ({otherRequests.length})
                </h2>
                <div className="space-y-4">
                  {otherRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.listing.title}
                              </h3>
                              <div className="flex items-center text-gray-600 mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">
                                  {request.listing.address}, {request.listing.city}
                                </span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{request.status}</span>
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                Tenant Details
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Name:</strong> {request.tenant.full_name}</p>
                                <p><strong>Email:</strong> {request.tenant.email}</p>
                                {request.tenant.phone && (
                                  <p><strong>Phone:</strong> {request.tenant.phone}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Requested Time
                              </h4>
                              <div className="text-sm text-gray-600">
                                <p>{formatDateTime(request.requestedDateTime)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Updated: {formatDateTime(request.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandlordViewingRequests; 