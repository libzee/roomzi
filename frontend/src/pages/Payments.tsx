import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Image, MapPin, User, Calendar, Settings, MessageCircle, ChartArea, BarChart, FileText } from 'lucide-react';
import Map from '@/components/Map';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

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

const Payments = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    
    const userId = user?.id || '';

    useEffect(() => {
        const fetchProperties = async () => {
            const response = await fetch(`http://localhost:3001/api/landlord/get-listings/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setProperties(data);
            }
        };
        fetchProperties();
    }, []);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const allPayments = [];

                for (const listing of properties) {
                    if (listing.landlord_id === userId) {
                        const response = await fetch(`http://localhost:3001/api/landlords/payments/${listing.id}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                        });
                        const data = await response.json();
                        if (response.ok) {
                            // Add listing title to each payment
                            const paymentsWithListing = data.map(payment => ({
                                ...payment,
                                listingTitle: listing.title || 'Untitled Listing'
                            }));
                            allPayments.push(paymentsWithListing);
                        } else if (response.status === 404) {
                            console.log(`No payments found for listing ${listing.id}`)
                        }
                    }
                }
                
                const payments = allPayments.flat();
                
                // Fetch tenant names for each payment with better error handling
                const paymentsWithTenant = await Promise.all(
                    payments.map(async (payment) => {
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
                                    // Keep the default tenant name
                                }
                            } catch (error) {
                                console.warn('Error fetching tenant name:', error);
                                // Keep the default tenant name
                            }
                        }
                        
                        return {
                            ...payment,
                            tenantName
                        };
                    })
                );
                
                setPayments(paymentsWithTenant);
            } catch (error) {
                console.log("Error fetching payments")
                setPayments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, [properties]);

    if (loading) return <div>Loading...</div>;
    if (!payments || payments.length === 0) return <div>No payments found</div>;

    const monthlyData = {};
    const listingGroups = {};
    
    payments.forEach(payment => {
        try {
            // Only include approved payments in the chart
            if (payment.status === 'Approved') {
                const date = new Date(payment.date);
                const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const listingTitle = payment.listingTitle || 'Unknown Listing';
                
                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = {};
                }
                if (!monthlyData[monthYear][listingTitle]) {
                    monthlyData[monthYear][listingTitle] = 0;
                }
                
                const amount = parseFloat(payment.amount) || 0;
                monthlyData[monthYear][listingTitle] += amount;
                
                listingGroups[listingTitle] = true;
            }
        } catch (error) {
            console.error('Error processing payment for chart:', error);
        }
    });

    // Sort by months chronologically
    const sortedEntries = Object.entries(monthlyData).sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
    });

    const sortedLabels = sortedEntries.map(([label]) => label);
    const uniqueListings = Object.keys(listingGroups);

    const datasets = uniqueListings.map((listingId, index) => {
        const colors = [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)',
        ];
        
        const borderColors = [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
        ];

        const data = sortedLabels.map(month => {
            return monthlyData[month]?.[listingId] || 0;
        });

        return {
            label: `${listingId}`,
            data: data.length > 0 ? data : [0],
            backgroundColor: colors[index % colors.length],
            borderColor: borderColors[index % borderColors.length],
            borderWidth: 1,
        };
    });

    const chartData = {
        labels: sortedLabels.length > 0 ? sortedLabels : ['No Data'],
        datasets: datasets.length > 0 ? datasets : [{
            label: 'No Payments',
            data: [0],
            backgroundColor: 'rgba(156, 163, 175, 0.6)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 1,
        }],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Monthly Income by Listing',
            },
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/landlord')}
                        className="flex items-center"
                    >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold text-roomzi-blue">Payments</h1>
                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>
                </div>
            </header>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Property Info Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Monthly Income</h2>
                                <div>
                                    {payments.length > 0 ? (
                                        <Bar data={chartData} options={chartOptions} />
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No payment data available for chart
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Payment History</h2>
                                <div>
                                    {payments.map((payment, index) => (
                                        <div key={payment.id || `payment-${index}`} className="border-b border-gray-200 py-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">${parseFloat(payment.amount).toFixed(2)}</p>
                                                    <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">{payment.listingTitle || 'Unknown Listing'}</p>
                                                    <p className="text-sm text-gray-600">{payment.tenantName || 'Unknown Tenant'}</p>
                                                    <div className="flex items-center justify-end mt-1">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            payment.status === 'Approved' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : payment.status === 'Pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {payment.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                {payment.proofUrl ? (
                                                    <a 
                                                        href={`http://localhost:3001${payment.proofUrl}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center text-blue-600 hover:underline text-sm"
                                                    >
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
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="p-6 sticky top-24 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            ${payments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0).toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Income</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-semibold text-gray-900">
                                            {payments.length}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Payments</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Payments;