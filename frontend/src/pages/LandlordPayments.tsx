import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, FileText, CheckCircle, Clock, XCircle, User } from 'lucide-react';

const statusColor = {
  Approved: 'text-green-600',
  Pending: 'text-yellow-600',
  Rejected: 'text-red-600',
};

const statusIcon = {
  Approved: <CheckCircle className="w-4 h-4 mr-1 text-green-600" />,
  Pending: <Clock className="w-4 h-4 mr-1 text-yellow-600" />,
  Rejected: <XCircle className="w-4 h-4 mr-1 text-red-600" />,
};

interface Payment {
  id: string;
  amount: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  date: string;
  proofUrl?: string;
  month?: string; // YYYY-MM format for the month being paid
  tenantName?: string;
  tenantEmail?: string;
  tenantId?: string;
  listingId?: string;
  landlordId?: string;
}

interface LandlordPaymentsProps {
  listingId?: string;
  onPaymentStatusChange?: () => void;
}

const LandlordPayments = ({ listingId, onPaymentStatusChange }: LandlordPaymentsProps) => {
  const params = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  
  // Use prop if provided, otherwise fall back to URL params
  const finalListingId = listingId || params.listingId;
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/payments/listing/${listingId}`)
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Response data:', data);
        // Handle both response formats: {success: true, payments: [...]} and direct array
        let allPayments = [];
        if (data.success && data.payments) {
          allPayments = data.payments;
        } else if (Array.isArray(data)) {
          allPayments = data;
        } else if (data.error) {
          setError(data.error || 'Failed to fetch payments.');
          return;
        } else {
          setError('Invalid response format from server.');
          return;
        }
        
        // Separate pending requests from payment history
        const pending = allPayments.filter(payment => payment.status === 'Pending');
        const history = allPayments.filter(payment => payment.status === 'Approved' || payment.status === 'Rejected');
        
        // Fetch tenant names for pending payments
        const fetchPendingTenantNames = async () => {
          const pendingWithTenants = await Promise.all(
            pending.map(async (payment) => {
              let tenantName = `Tenant ${payment.tenantId ? payment.tenantId.slice(0, 8) : 'Unknown'}`;
              
              if (payment.tenantId) {
                try {
                  const tenantResponse = await fetch(`http://localhost:3001/api/tenants/${payment.tenantId}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                  });
                  
                  if (tenantResponse.ok) {
                    const tenantData = await tenantResponse.json();
                    console.log('Tenant response:', tenantData);
                    
                    if (tenantData.success && tenantData.data && tenantData.data.full_name) {
                      tenantName = tenantData.data.full_name;
                    } else if (tenantData.data && tenantData.data.full_name) {
                      tenantName = tenantData.data.full_name;
                    }
                  } else {
                    console.warn(`Failed to fetch tenant ${payment.tenantId}: ${tenantResponse.status}`);
                  }
                } catch (error) {
                  console.warn('Error fetching tenant name:', error);
                }
              }
              
              return {
                ...payment,
                tenantName
              };
            })
          );
          
          setPendingPayments(pendingWithTenants);
        };

        // Fetch tenant names for payment history
        const fetchHistoryTenantNames = async () => {
          const historyWithTenants = await Promise.all(
            history.map(async (payment) => {
              let tenantName = `Tenant ${payment.tenantId ? payment.tenantId.slice(0, 8) : 'Unknown'}`;
              
              if (payment.tenantId) {
                try {
                  const tenantResponse = await fetch(`http://localhost:3001/api/tenants/${payment.tenantId}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                  });
                  
                  if (tenantResponse.ok) {
                    const tenantData = await tenantResponse.json();
                    
                    if (tenantData.success && tenantData.data && tenantData.data.full_name) {
                      tenantName = tenantData.data.full_name;
                    } else if (tenantData.data && tenantData.data.full_name) {
                      tenantName = tenantData.data.full_name;
                    }
                  } else {
                    console.warn(`Failed to fetch tenant ${payment.tenantId}: ${tenantResponse.status}`);
                  }
                } catch (error) {
                  console.warn('Error fetching tenant name:', error);
                }
              }
              
              return {
                ...payment,
                tenantName
              };
            })
          );
          
          setPaymentHistory(historyWithTenants);
        };
        
        fetchPendingTenantNames();
        fetchHistoryTenantNames();
      })
      .catch(err => {
        setError('Error fetching payments.');
      })
      .finally(() => setLoading(false));
  }, [listingId]);

  const handleStatusUpdate = async (paymentId: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`http://localhost:3001/api/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (data.success) {
        // Move payment from pending to history
        const updatedPayment = pendingPayments.find(p => p.id === paymentId);
        if (updatedPayment) {
          const paymentWithNewStatus = { ...updatedPayment, status: newStatus };
          setPendingPayments(pending => pending.filter(p => p.id !== paymentId));
          setPaymentHistory(history => [paymentWithNewStatus, ...history]);
          
          // Call the callback to notify parent component
          if (onPaymentStatusChange) {
            onPaymentStatusChange();
          }
        }
      } else {
        console.error('Failed to update payment status:', data.error);
      }
    } catch (err) { 
      console.error('Error updating payment status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Payment Requests */}
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Pending Payment Requests</h2>
        {loading && <div className="text-gray-500">Loading payments...</div>}
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {!loading && !error && pendingPayments.length === 0 && (
          <div className="text-gray-500">No pending payment requests for this property.</div>
        )}
        <div className="space-y-4">
          {pendingPayments.map(payment => (
            <Card key={payment.id} className="p-4 flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-4">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-lg font-semibold">${payment.amount.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm">{new Date(payment.date).toLocaleDateString()}</div>
                    {payment.month && (
                      <div className="text-sm text-blue-600 font-medium">
                        For: {(() => {
                          const [year, month] = payment.month.split('-');
                          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          });
                        })()}
                      </div>
                    )}
                    {payment.tenantName && (
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {payment.tenantName} {payment.tenantEmail && <span className="ml-2 text-gray-400">({payment.tenantEmail})</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                  <span className={`flex items-center font-medium ${statusColor[payment.status]}`}>{statusIcon[payment.status]}{payment.status}</span>
                  {payment.proofUrl ? (
                    <a href={`http://localhost:3001${payment.proofUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline text-sm">
                      <FileText className="w-4 h-4 mr-1" />
                      View Proof
                    </a>
                  ) : (
                    <span className="flex items-center text-gray-400 text-sm">
                      <FileText className="w-4 h-4 mr-1" />
                      No Proof
                    </span>
                  )}
                </div>
              </div>
              {/* Action buttons for Pending payments */}
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => handleStatusUpdate(payment.id, 'Approved')}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => handleStatusUpdate(payment.id, 'Rejected')}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Payment History */}
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Payment History</h2>
        {!loading && !error && paymentHistory.length === 0 && (
          <div className="text-gray-500">No payment history for this property.</div>
        )}
        <div className="space-y-4">
          {paymentHistory.map(payment => (
            <Card key={payment.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-4">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-lg font-semibold">${payment.amount.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm">{new Date(payment.date).toLocaleDateString()}</div>
                    {payment.month && (
                      <div className="text-sm text-blue-600 font-medium">
                        For: {(() => {
                          const [year, month] = payment.month.split('-');
                          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          });
                        })()}
                      </div>
                    )}
                    {payment.tenantName && (
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {payment.tenantName} {payment.tenantEmail && <span className="ml-2 text-gray-400">({payment.tenantEmail})</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                  <span className={`flex items-center font-medium ${statusColor[payment.status]}`}>{statusIcon[payment.status]}{payment.status}</span>
                  {payment.proofUrl ? (
                    <a href={`http://localhost:3001${payment.proofUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline text-sm">
                      <FileText className="w-4 h-4 mr-1" />
                      View Proof
                    </a>
                  ) : (
                    <span className="flex items-center text-gray-400 text-sm">
                      <FileText className="w-4 h-4 mr-1" />
                      No Proof
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LandlordPayments; 