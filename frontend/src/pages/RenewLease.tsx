import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { supabase } from '@/lib/supabaseClient';

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function getDaysUntil(dateString?: string) {
  if (!dateString) return null;
  const end = new Date(dateString);
  const now = new Date();
  end.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

const RenewLease = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [lease, setLease] = useState<any>(null);
  const [leaseLoading, setLeaseLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    apiFetch(`${getApiBaseUrl()}/api/listings/${listingId}`)
      .then(response => {
        if (response.success && response.data) {
          const data = response.data;
          setAddress(`${data.address}, ${data.city}, ${data.state}`);
        } else {
          setAddress('Address not found');
        }
      })
      .catch(() => setAddress('Address not found'))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    setLeaseLoading(true);
    const fetchLease = async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('start_date, end_date, rent, document')
        .eq('listing_id', Number(listingId))
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
      if (data && !error) {
        setLease(data);
      } else {
        setLease(null);
      }
      setLeaseLoading(false);
    };
    fetchLease();
  }, [listingId]);

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
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Lease Agreement</h1>
            </div>
            <span className="text-gray-700 font-medium text-base truncate max-w-xs text-right">
              {loading ? 'Loading address...' : address}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Download Lease Document Section */}
        <div className="w-full max-w-xl bg-white rounded shadow p-6 mb-8 mx-auto">
          <h2 className="text-xl font-semibold mb-4">Lease Document</h2>
          {lease && lease.document ? (
            <a
              href={lease.document}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition text-center"
            >
              Download Lease Document
            </a>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No lease document available.<br />
              (You will see a download link here when a lease is uploaded.)
            </div>
          )}
        </div>

        {/* Lease Details Section */}
        <div className="w-full max-w-xl bg-white rounded shadow p-6 mb-8 mx-auto">
          <h2 className="text-xl font-semibold mb-4">Lease Details</h2>
          {leaseLoading ? (
            <div className="text-gray-500 text-center py-4">Loading lease details...</div>
          ) : lease ? (
            <div className="space-y-2 text-center">
              <div><span className="font-semibold">Lease Start:</span> {formatDate(lease.start_date)}</div>
              <div><span className="font-semibold">Lease End:</span> {formatDate(lease.end_date)}</div>
              <div><span className="font-semibold">Monthly Price:</span> ${lease.rent}</div>
              {/* Notification for days until lease ends */}
              {(() => {
                const days = getDaysUntil(lease.end_date);
                if (days === null) return null;
                if (days > 0) {
                  return <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded">{days} day{days !== 1 ? 's' : ''} left until lease ends.</div>;
                } else if (days === 0) {
                  return <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded">Lease ends today.</div>;
                } else {
                  return <div className="mt-4 p-3 bg-red-50 text-red-800 rounded">Lease ended {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} ago.</div>;
                }
              })()}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">No lease details found for this property.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenewLease; 