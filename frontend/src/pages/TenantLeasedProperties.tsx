import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeasesForTenant } from '@/utils/api';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Home, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-xl shadow-lg bg-white border-0 flex flex-col animate-pulse">
    <div className="relative aspect-[4/3] bg-gray-200" />
    <div className="p-5 border-t flex-1 flex flex-col">
      <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="flex gap-2 mb-2">
        <div className="h-6 w-16 bg-gray-100 rounded" />
        <div className="h-6 w-20 bg-gray-100 rounded ml-auto" />
      </div>
      <div className="h-10 bg-gray-100 rounded w-full mt-auto" />
    </div>
  </div>
);

const TenantLeasedProperties: React.FC = () => {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeases = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getLeasesForTenant(user.id);
        if (response.success && Array.isArray(response.data)) {
          setLeases(response.data);
        } else {
          setError('Failed to fetch leased properties.');
          toast({ title: 'Error', description: 'Failed to fetch leased properties.', variant: 'destructive' });
        }
      } catch (err) {
        setError('Failed to fetch leased properties.');
        toast({ title: 'Error', description: 'Failed to fetch leased properties.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchLeases();
    // eslint-disable-next-line
  }, [user]);

  // Deduplicate leases by listing_id, keeping the most recent lease per property
  const uniqueLeases = Object.values(
    leases.reduce((acc, lease) => {
      if (
        !acc[lease.listing_id] ||
        new Date(lease.start_date) > new Date(acc[lease.listing_id].start_date)
      ) {
        acc[lease.listing_id] = lease;
      }
      return acc;
    }, {})
  );

  // Function to determine rental status based on lease information
  const determineRentalStatus = (lease: any) => {
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
                onClick={() => navigate('/tenant')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">My Leased Properties</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-8 max-w-md text-center">{error}</p>
            <Button onClick={() => window.location.reload()} className="roomzi-gradient">
              Retry
            </Button>
          </div>
        ) : uniqueLeases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Leased Properties</h2>
            <p className="text-gray-600 mb-8 max-w-md text-center">
              When you lease a property, it will appear here. Start browsing to find your perfect home!
            </p>
            <Button onClick={() => navigate('/tenant')} className="roomzi-gradient">
              Browse Properties
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {uniqueLeases.map((lease: any) => {
              // Match image extraction logic to TenantMyHouse
              let imageUrl = '/placeholder.svg';
              const imgs = lease.listings?.images;
              if (imgs) {
                if (Array.isArray(imgs) && imgs.length > 0) {
                  imageUrl = imgs[0];
                } else if (typeof imgs === 'string') {
                  try {
                    const arr = JSON.parse(imgs);
                    if (Array.isArray(arr) && arr.length > 0) {
                      imageUrl = arr[0];
                    } else {
                      imageUrl = imgs;
                    }
                  } catch {
                    imageUrl = imgs;
                  }
                }
              }
              return (
                <Card
                  key={lease.id}
                  className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-200 hover:scale-105 bg-white border-0 cursor-pointer flex flex-col group"
                  onClick={() => navigate(`/tenant/my-house/${lease.listing_id}`)}
                >
                  <div className="relative aspect-[4/3] bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={lease.listings?.title || 'Property'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    {imageUrl && imageUrl !== '/placeholder.svg' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                    )}
                    {!imageUrl || imageUrl === '/placeholder.svg' ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Home className="w-12 h-12" />
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5 border-t flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-1 text-gray-900 line-clamp-1">{lease.listings?.title || 'Property'}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">{lease.listings?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${determineRentalStatus(lease).color} px-3 py-1`}>
                        {determineRentalStatus(lease).status}
                      </Badge>
                      <span className="text-blue-600 font-bold ml-auto">${lease.rent}/month</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-auto transition-transform duration-150 group-hover:scale-105 group-hover:shadow-md"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/tenant/my-house/${lease.listing_id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantLeasedProperties; 