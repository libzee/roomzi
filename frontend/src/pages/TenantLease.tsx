import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, UploadCloud, CheckCircle, FileText, PenLine } from 'lucide-react';
import { getLeaseById, uploadSignedLease, getListingById, tenantApi } from '@/utils/api';
import { Document, Page, pdfjs } from 'react-pdf';

const TenantLease: React.FC = () => {
  const { leaseId } = useParams();
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [property, setProperty] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [confirmedSigned, setConfirmedSigned] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Stepper steps and helpers (moved inside component)
  const steps = [
    'Download Lease',
    'Sign Lease',
    'Upload Signed Lease',
    'Complete',
  ];
  // Calculate current step based on lease status
  const getCurrentStep = () => {
    if (!lease) return 0;
    if (lease.signed) return 3; // Complete
    if (uploadedFile) return 2; // Upload Signed Lease
    if (lease.document) return 0; // Download Lease (ready to download)
    return 0; // No document yet
  };
  
  const currentStep = getCurrentStep();

  useEffect(() => {
    const fetchLease = async () => {
      if (!leaseId) return;
      setLoading(true);
      try {
        const response = await getLeaseById(leaseId);
        if (response.success && response.data) {
          setLease(response.data);
          // Fetch property details if listing_id exists
          if (response.data.listing_id) {
            const propRes = await getListingById(response.data.listing_id);
            if (propRes.success && propRes.data) {
              setProperty(propRes.data);
            }
          }
          // Fetch tenant profile if tenant_id exists
          if (response.data.tenant_id) {
            const tenantRes = await tenantApi.getById(response.data.tenant_id);
            if (tenantRes.success && tenantRes.data?.data) {
              setTenant(tenantRes.data.data);
            }
          }
        } else {
          setFatalError('Lease not found');
        }
      } catch (err) {
        setFatalError('Failed to fetch lease');
      } finally {
        setLoading(false);
      }
    };
    fetchLease();
  }, [leaseId]);

  const handleDownload = () => {
    if (!lease?.document) return;
    window.open(lease.document, '_blank');
  };

  // Helper to extract filename from a URL
  const getFilenameFromUrl = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1);
    } catch {
      return '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // File type and size validation
      if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setUploadError('Only PDF or image files are allowed.');
        setUploadedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB.');
        setUploadedFile(null);
        return;
      }
      setUploadError(null);
      setUploadedFile(file);
      try {
        await uploadSignedLease(leaseId!, file);
        setUploadSuccess(true);
        setLease((prev: any) => ({ ...prev, signed: true, signed_at: new Date().toISOString() }));
        // Set state to trigger refresh when navigating back
        window.history.replaceState({ leaseSigned: true }, document.title);
      } catch (err) {
        setUploadError('Failed to upload signed lease');
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // File type and size validation
      if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setUploadError('Only PDF or image files are allowed.');
        setUploadedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB.');
        setUploadedFile(null);
        return;
      }
      setUploadError(null);
      setUploadedFile(file);
      try {
        await uploadSignedLease(leaseId!, file);
        setUploadSuccess(true);
        setLease((prev: any) => ({ ...prev, signed: true, signed_at: new Date().toISOString() }));
        // Set state to trigger refresh when navigating back
        window.history.replaceState({ leaseSigned: true }, document.title);
      } catch (err) {
        setUploadError('Failed to upload signed lease');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUploadAreaClick = () => {
    setUploadError(null);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading lease...</div>;
  if (fatalError) return <div className="flex justify-center items-center min-h-screen text-red-600">{fatalError}</div>;
  if (!lease) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10">
      <Card className="w-full max-w-xl p-8 shadow-2xl border-0 bg-white/90">
        {/* Stepper & Instructions */}
        <div className="mb-6">
          <ol className="flex items-center w-full mb-4">
            {steps.map((step, idx) => (
              <li key={step} className={`flex-1 flex flex-col items-center ${idx <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${idx <= currentStep ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-gray-100'}`}>{idx + 1}</div>
                <span className="mt-2 text-xs font-semibold text-center">{step}</span>
              </li>
            ))}
          </ol>
          {/* Separate progress bar that extends under all steps */}
          <div className="flex items-center w-full mb-4 -mt-2">
            {steps.map((step, idx) => (
              <div key={`progress-${step}`} className="flex-1 flex items-center">
                <div className={`h-1 w-full ${idx <= currentStep ? 'bg-gradient-to-r from-blue-200 to-blue-400' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
          <div className="text-center text-gray-700 text-sm mb-2">
            <strong>How it works:</strong> Download your lease, sign it (digitally or by hand), then upload the signed version below. Only PDF or image files up to 10MB are accepted.
          </div>
        </div>
        {/* Lease Status & Timestamps */}
        <div className="mb-4 flex flex-col items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${lease.signed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {lease.signed ? 'Signed' : 'Unsigned'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Created: {lease.created_at ? new Date(lease.created_at).toLocaleString() : 'N/A'}
            {lease.signed && lease.signed_at && (
              <>
                <br />Signed: {new Date(lease.signed_at).toLocaleString()}
              </>
            )}
          </span>
        </div>
        {/* Lease Details */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center mb-2 text-blue-900 font-semibold">
            <FileText className="w-4 h-4 mr-2" />
            {property ? `${property.title || ''} ${property.address ? '- ' + property.address : ''}` : (lease.property || lease.listing_id || 'N/A')}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div><strong>Landlord:</strong> {property?.landlord_name || 'N/A'}</div>
            <div><strong>Tenant:</strong> {tenant?.full_name || lease.tenant_id || 'N/A'}</div>
            <div><strong>Lease Term:</strong> {lease.start_date ? new Date(lease.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} to {lease.end_date ? new Date(lease.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
            <div><strong>Monthly Rent:</strong> ${lease.rent || 'N/A'}</div>
          </div>
        </div>
        {/* PDF Preview for Lease Document */}
        {/* Step 1: Download */}
        <div className="flex flex-col items-center mb-6">
          <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-100" disabled={!lease.document}>
            <Download className="w-5 h-5" /> Download Lease
          </Button>
        </div>
        {/* Step 2: Sign Lease (visual only) */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 text-lg text-blue-700 font-medium">
            <PenLine className="w-5 h-5" /> Sign the lease (on your device or print & sign)
          </div>
        </div>
        {/* Step 3: Upload */}
        <div className="flex flex-col items-center mb-6">
          {lease.signed ? (
            <div className="flex items-center gap-2 mt-4 animate-fade-in">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-green-700 font-semibold">Signed lease uploaded successfully!</span>
              {/* Download signed lease if available */}
              {lease.document && (
                <Button onClick={handleDownload} variant="link" className="ml-2 text-blue-700 underline">Download Signed Lease</Button>
              )}
            </div>
          ) : (
            <>
              {uploadError && (
                <div className="w-full max-w-xs mb-2 p-2 rounded bg-red-100 border border-red-400 text-red-700 font-bold text-center flex items-center justify-center gap-2">
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-red-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                  {uploadError}
                </div>
              )}
              <div
                className={`w-full max-w-xs p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white'}`}
                onClick={() => { fileInputRef.current?.click(); handleUploadAreaClick(); }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <UploadCloud className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-blue-700 font-medium">Drag & drop or click to upload signed lease</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploadedFile && (
                  <span className="mt-2 text-green-700 font-semibold animate-fade-in">{uploadedFile.name}</span>
                )}
              </div>
            </>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="w-full mt-2">Back</Button>
      </Card>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
      `}</style>
    </div>
  );
};

export default TenantLease; 