import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
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
import LandlordPayments from './LandlordPayments';

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

const ManageListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    
    useEffect(() => {
        const fetchProperty = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`${getApiBaseUrl()}/api/listings/${id}`);
                if (response.success) {
                    const data = response.data;
                    setProperty({
                        ...data,
                        houseRules: data.house_rules,
                        landlordName: data.landlord_name,
                        landlordPhone: data.landlord_phone,
                        landlordId: data.landlord_id,
                        zipCode: data.zip_code,
                        leaseType: data.lease_type,
                        images: data.images,
                        amenities: data.amenities,
                        requirements: data.requirements,
                        coordinates: data.coordinates,
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

    // Fetch payments for the chart
    useEffect(() => {
        if (!property) return;
        const fetchPayments = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/payments/listing/${property.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setPayments(data.payments || []);
                }
            } catch (error) {
                console.log("Error fetching payments for chart");
                setPayments([]);
            }
        };
        fetchPayments();
    }, [property, refreshKey]);

    if (loading) return <div>Loading...</div>;
    if (!property) return <div>Property not found</div>;

    // Calculate monthly income data for the chart
    const monthlyData = {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    // Process payments to calculate monthly income
    payments.forEach(payment => {
        if (payment.status === 'Approved') {
            let month;
            // Use the month field if available (more accurate), otherwise fall back to payment date
            if (payment.month) {
                const [year, monthNum] = payment.month.split('-');
                const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                month = date.toLocaleDateString('en-US', { month: 'short' });
            } else {
                const paymentDate = new Date(payment.date);
                month = paymentDate.toLocaleDateString('en-US', { month: 'short' });
            }
            
            if (monthlyData.hasOwnProperty(month)) {
                monthlyData[month] += parseFloat(payment.amount);
            }
        }
    });

    // Chart data for monthly income
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Monthly Income',
                data: [
                    monthlyData.Jan, monthlyData.Feb, monthlyData.Mar, monthlyData.Apr,
                    monthlyData.May, monthlyData.Jun, monthlyData.Jul, monthlyData.Aug,
                    monthlyData.Sep, monthlyData.Oct, monthlyData.Nov, monthlyData.Dec
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
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
                    <h1 className="text-2xl font-bold text-roomzi-blue">Manage Listing</h1>
                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>
                </div>
            </header>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Property Info Grid */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-3 space-y-6">
                            {/* Actions */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Actions</h2>
                                <div className="space-x-3">
                                    <Button className="w-fit">
                                        View Tenant Details
                                    </Button>
                                    <Button className="w-fit" onClick={() => navigate(`/landlord/lease-agreement/${property.id}`)}>
                                        View Lease Agreement
                                    </Button>
                                </div>
                            </Card>

                            <LandlordPayments 
                                listingId={property?.id} 
                                onPaymentStatusChange={() => setRefreshKey(prev => prev + 1)}
                            />

                            {/* Monthly Income */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Monthly Income</h2>
                                <div>
                                    {payments.length > 0 ? (
                                        <Bar data={chartData} options={chartOptions} />
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No payment data available for this listing
                                        </div>
                                    )}
                                </div>
                            </Card>


                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageListing;