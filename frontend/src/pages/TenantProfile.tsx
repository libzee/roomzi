import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Camera, FileText, Settings, Home, Loader2, Save, X, Download, Trash2, Upload } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

import { landlordApi, ApiError, apiFetch, getApiBaseUrl, tenantApi } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';
import { supabase } from '@/lib/supabaseClient';
import { documentUtils } from '@/utils/api';

interface TenantProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  image_url?: string | null;
  address?: string | null;
  documents?: Array<{ path: string; displayName: string }>;
  created_at?: string;
  updated_at?: string;
  viewingRequestNotifications?: boolean;
  rentReminderDays?: number;
  preferredHouseTypes?: string[];
  preferredRentMin?: number;
  preferredRentMax?: number;
  preferredDistance?: number;
}

const TenantProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [switching, setSwitching] = useState(false);

  const [name, setName] = useState(user?.user_metadata?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [location, setLocation] = useState(user?.user_metadata?.location || '');
  const [saving, setSaving] = useState(false);
  // Removed duplicate saving here

  const [profilePhoto, setProfilePhoto] = useState(user?.user_metadata?.profilePhoto || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<TenantProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Add state for document upload
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [documents, setDocuments] = useState<{ path: string; displayName: string }[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other'>('other');

  // Add state for settings
  const [viewingRequestNotifications, setViewingRequestNotifications] = useState(true);
  const [rentReminderDays, setRentReminderDays] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Add state for preferences
  const [preferredHouseTypes, setPreferredHouseTypes] = useState<string[]>([]);
  const [preferredRentMin, setPreferredRentMin] = useState<number | undefined>();
  const [preferredRentMax, setPreferredRentMax] = useState<number | undefined>();
  const [preferredDistance, setPreferredDistance] = useState<number | undefined>();

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Combined function to save all settings and preferences
  const saveAllSettings = async () => {
    if (!user?.id) return;
    
    // Check if user has set their address for distance filtering
    if (preferredDistance && !profileData?.address) {
      toast({
        title: "Address Required",
        description: "Please set your current address in Personal Info to use distance filtering.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Saving all settings:', { 
      viewingRequestNotifications, 
      rentReminderDays,
      preferredHouseTypes,
      preferredRentMin,
      preferredRentMax,
      preferredDistance
    });
    
    setSavingSettings(true);
    try {
      // Save all settings and preferences in one API call
      const updateResult = await tenantApi.update(user.id, {
        viewingRequestNotifications,
        rentReminderDays,
        preferredHouseTypes,
        preferredRentMin,
        preferredRentMax,
        preferredDistance,
      });

      console.log('Update result:', updateResult);

      if (updateResult.success) {
        toast({
          title: "Settings Saved",
          description: "All your settings and preferences have been updated.",
          variant: "default",
        });
      } else {
        console.error('Update failed:', updateResult);
        toast({
          title: "Save Failed",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };



  // Add function to handle house type selection
  const handleHouseTypeToggle = (houseType: string) => {
    setPreferredHouseTypes(prev => 
      prev.includes(houseType)
        ? prev.filter(type => type !== houseType)
        : [...prev, houseType]
    );
  };

  // Add function to clear all house preferences
  const handleClearHousePreferences = async () => {
    if (!user?.id) return;
    
    setSavingSettings(true);
    try {
      // Clear local state
      setPreferredHouseTypes([]);
      setPreferredRentMin(undefined);
      setPreferredRentMax(undefined);
      setPreferredDistance(undefined);
      
      // Save cleared preferences to database
      const updateResult = await tenantApi.update(user.id, {
        preferredHouseTypes: [],
        preferredRentMin: null,
        preferredRentMax: null,
        preferredDistance: null,
      });

      if (updateResult.success) {
        toast({
          title: "Preferences Cleared",
          description: "All house preferences have been reset and saved.",
          variant: "default",
        });
      } else {
        toast({
          title: "Save Failed",
          description: "Preferences were cleared but failed to save. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error clearing preferences:', error);
      toast({
        title: "Error",
        description: "Failed to clear preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Update useEffect to fetch settings from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await tenantApi.getById(user.id);

        if (result.success && result.data) {
          setProfileData(result.data.data);
          setFormData({
            full_name: result.data.data.full_name || '',
            email: result.data.data.email || '',
            phone: result.data.data.phone || '',
            address: result.data.data.address || '',
          });
          setDocuments(result.data.data.documents || []);
          // Set settings from API response
          setViewingRequestNotifications(result.data.data.viewingRequestNotifications ?? true);
          setRentReminderDays(result.data.data.rentReminderDays ?? 3);
          // Set preferences from API response
          setPreferredHouseTypes(result.data.data.preferredHouseTypes || []);
          setPreferredRentMin(result.data.data.preferredRentMin);
          setPreferredRentMax(result.data.data.preferredRentMax);
          setPreferredDistance(result.data.data.preferredDistance);
        } else {
          // Create profile if not found with user's auth data
          const createResult = await tenantApi.create(user.id, user.email || '', user.user_metadata);
          if (createResult.success && createResult.data) {
            setProfileData(createResult.data.data);
            setFormData({
              full_name: createResult.data.data.full_name || '',
              email: createResult.data.data.email || '',
              phone: createResult.data.data.phone || '',
              address: createResult.data.data.address || '',
            });
            setDocuments(createResult.data.data.documents || []);
            // Set settings from created profile
            setViewingRequestNotifications(createResult.data.data.viewingRequestNotifications ?? true);
            setRentReminderDays(createResult.data.data.rentReminderDays ?? 3);
            // Set preferences from created profile
            setPreferredHouseTypes(createResult.data.data.preferredHouseTypes || []);
            setPreferredRentMin(createResult.data.data.preferredRentMin);
            setPreferredRentMax(createResult.data.data.preferredRentMax);
            setPreferredDistance(createResult.data.data.preferredDistance);
            setEditMode(true);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleSwitchToLandlord = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first.",
        variant: "destructive",
      });
      return;
    }

    setSwitching(true);

    try {
      const profileResult = await landlordApi.create(user.id, user.email || '', user.user_metadata);

      if (profileResult.success) {
        if (profileResult.alreadyExists) {
          console.log('✅ Landlord profile already exists - user can proceed');
        } else {
          console.log('✅ New landlord profile created successfully');
        }
      }

      await updateUserMetadata('landlord');
      setUserRole('landlord');

      toast({
        title: "Role Switched",
        description: "Welcome to your landlord dashboard!",
        variant: "default",
      });

      navigate('/landlord');
      window.location.reload();
    } catch (error) {
      let errorMessage = "Unable to switch to landlord role. Please try again.";

      if (error instanceof ApiError) {
        if (error.status === 0) {
          errorMessage = "Unable to connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Switch Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      const updateResult = await tenantApi.update(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        image_url: profilePhoto,
      });

      if (updateResult.success) {
        // Always fetch the latest profile data after update
        const refreshed = await tenantApi.getById(user.id);
        if (refreshed.success && refreshed.data) {
          setProfileData(refreshed.data.data);
          setFormData({
            full_name: refreshed.data.data.full_name || '',
            email: refreshed.data.data.email || '',
            phone: refreshed.data.data.phone || '',
            address: refreshed.data.data.address || '',
          });
        }
        setEditMode(false);
        window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
          detail: {
            fullName: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            profilePhoto,
          }
        }));
        navigate('/tenant', { state: { profileUpdated: true } });
        toast({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "default",
        });
      } else {
        throw new Error(updateResult.message || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: (error as Error)?.message || 'Failed to save profile changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCameraButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`; // use profile-images bucket
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images') // use profile-images bucket
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // Get public URL
      const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath); // use profile-images bucket
      if (!data?.publicUrl) throw new Error('Failed to get public URL');
      // Update user metadata/profile with new photo URL
      await tenantApi.update(user.id, { image_url: data.publicUrl });
      // Always fetch the latest profile data after update
      const refreshed = await tenantApi.getById(user.id);
      if (refreshed.success && refreshed.data) {
        setProfileData(refreshed.data.data);
      }
      toast({
        title: 'Profile Photo Updated',
        description: 'Your new photo has been saved.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Photo Upload Failed',
        description: (error as Error)?.message || 'Could not upload photo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });
    }
    setEditMode(false);
  };

  // Add document upload handler
  const handleDocumentUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id || !newDocFile || !newDocName.trim()) return;

    setUploadingDocument(true);
    try {
      const documentPath = await documentUtils.uploadDocument(newDocFile, user.id, newDocName);
      const newDocObj = { path: documentPath, displayName: newDocName };
      const newDocuments = [...(profileData?.documents || []), newDocObj];
      console.log('Sending documents to API:', newDocuments);
      const updateResult = await tenantApi.update(user.id, { documents: newDocuments });

      if (updateResult.success) {
        setDocuments(newDocuments);
        setProfileData(prev => prev ? { ...prev, documents: newDocuments } : null);
        setNewDocFile(null);
        setNewDocName('');
        toast({ title: "Success", description: `Document uploaded successfully!`, variant: "default" });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: (error as Error)?.message || "Failed to upload document.", variant: "destructive" });
    } finally {
      setUploadingDocument(false);
    }
  };

  // Add document delete handler
  const handleDocumentDelete = async (docObj: { path: string; displayName: string }) => {
    if (!user?.id) return;

    try {
      await documentUtils.deleteDocument(docObj.path);
      const newDocuments = (profileData?.documents || []).filter(d => d.path !== docObj.path);
      const updateResult = await tenantApi.update(user.id, { documents: newDocuments });

      if (updateResult.success) {
        setDocuments(newDocuments);
        setProfileData(prev => prev ? { ...prev, documents: newDocuments } : null);
        toast({ title: "Success", description: "Document deleted successfully!", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Delete Failed", description: (error as Error)?.message || "Failed to delete document.", variant: "destructive" });
    }
  };

  // Add document view handler
  const handleDocumentView = async (docObj: { path: string; displayName: string }) => {
    try {
      const { data } = await supabase.storage.from('documents').createSignedUrl(docObj.path, 60);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        const fileExtension = docObj.path.split('.').pop()?.toLowerCase();
        if (fileExtension === 'pdf') {
          setPreviewType('pdf');
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
          setPreviewType('image');
        } else {
          setPreviewType('other');
        }
        setPreviewName(docObj.displayName || docObj.path.split('/').pop() || 'Document');
      }
    } catch (error) {
      toast({ title: "View Failed", description: "Failed to open document. Please try again.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-roomzi-blue" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-roomzi-blue">Profile</h1>
            </div>
            <Badge variant="secondary">Tenant</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profileData?.image_url ? (
                  <img src={profileData.image_url} alt="Profile" className="w-24 h-24 object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={handleCameraButtonClick}
                disabled={uploadingPhoto}
                aria-label="Change profile photo"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePhotoChange}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData?.full_name || 'Tenant'}
              </h2>
              <p className="text-gray-600">{profileData?.email}</p>
              {profileData?.phone && (
                <p className="text-gray-600">{profileData.phone}</p>
              )}
              {profileData?.address && (
                <p className="text-gray-600">{profileData.address}</p>
              )}
              <Badge className="mt-2 bg-green-100 text-green-800">Verified</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSwitchToLandlord}
                variant="outline"
                className="flex items-center"
                disabled={switching}
              >
                {switching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Home className="w-4 h-4 mr-2" />
                )}
                {switching ? 'Switching...' : 'Switch to Landlord'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-roomzi-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              {editMode && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    size="sm"
                    className="flex items-center roomzi-gradient"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input 
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={!editMode}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editMode}
                  type="email"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editMode}
                  type="tel"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editMode}
                  placeholder="Enter your address"
                />
              </div>
            </div>
            {!editMode && (
              <Button 
                className="mt-4 roomzi-gradient"
                onClick={() => setEditMode(true)}
              >
                Edit Information
              </Button>
            )}
          </Card>
        )}
        {activeTab === 'docs' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Documents</h3>
            <div className="mb-2 text-sm text-gray-600">Allowed file types: PDF, JPG, JPEG, PNG, DOC, DOCX. Max size: 10MB.</div>
            <form className="flex gap-2 mb-4" onSubmit={handleDocumentUpload}>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setNewDocFile(e.target.files?.[0] || null)} />
              <Input type="text" placeholder="Display name" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
              <Button type="submit" disabled={uploadingDocument || !newDocFile || !newDocName.trim()}>{uploadingDocument ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</Button>
            </form>
            <ul className="space-y-2">
              {(profileData?.documents || [])
                .filter(docObj => docObj && typeof docObj === 'object' && docObj.path)
                .map((docObj, idx) => (
                  <li key={docObj.path || idx} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="flex-1">{docObj.displayName || (docObj.path ? docObj.path.split('/').pop() : 'Unknown')}</span>
                    <Button size="sm" variant="outline" onClick={() => handleDocumentView(docObj)}><Download className="w-4 h-4" /> View</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDocumentDelete(docObj)}><Trash2 className="w-4 h-4" /> Delete</Button>
                  </li>
                ))}
              </ul>
          </Card>
        )}
        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Settings</h3>
            <div className="space-y-8">
              {/* Notification Settings */}
              <div>
                <h4 className="text-lg font-medium mb-4">Notification Settings</h4>
                <div className="space-y-4">
                  {/* a) Viewing Request Notifications */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h5 className="font-medium">Viewing Request Notifications</h5>
                      <p className="text-sm text-gray-600">Enable notifications for viewing request updates</p>
                    </div>
                                    <Switch
                  checked={viewingRequestNotifications}
                  onCheckedChange={(checked) => {
                    console.log('Toggle changed:', checked);
                    setViewingRequestNotifications(checked);
                  }}
                />
                  </div>
                  {/* b) Rent Payment Reminder Days */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h5 className="font-medium">Rent Payment Reminder</h5>
                      <p className="text-sm text-gray-600">Number of days before rent due to receive a reminder</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={rentReminderDays}
                      onChange={e => setRentReminderDays(Number(e.target.value))}
                      className="w-20 border rounded px-2 py-1 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* House Preferences */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">House Preferences</h4>
                  <Button
                    onClick={handleClearHousePreferences}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Clear All Preferences
                  </Button>
                </div>
                <div className="space-y-6">
                  {/* House Type Preferences */}
                  <div>
                    <h5 className="font-medium mb-3">Preferred House Types</h5>
                    <p className="text-sm text-gray-600 mb-3">Select the types of properties you're interested in</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['room', 'apartment', 'house', 'condo'].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleHouseTypeToggle(type)}
                          className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                            preferredHouseTypes.includes(type)
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rent Range Preferences */}
                  <div>
                    <h5 className="font-medium mb-3">Rent Range</h5>
                    <p className="text-sm text-gray-600 mb-3">Set your preferred monthly rent range</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Rent ($)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={preferredRentMin || ''}
                          onChange={(e) => setPreferredRentMin(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Rent ($)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={preferredRentMax || ''}
                          onChange={(e) => setPreferredRentMax(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 3000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Distance Preferences */}
                  <div>
                    <h5 className="font-medium mb-3">Maximum Distance</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      {profileData?.address 
                        ? "Set the maximum distance from your current location"
                        : "Please set your current address in Personal Info to use distance filtering"
                      }
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={preferredDistance || ''}
                        onChange={(e) => setPreferredDistance(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g., 10"
                        disabled={!profileData?.address}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">miles</span>
                    </div>
                    {!profileData?.address && (
                      <p className="text-sm text-orange-600 mt-2">
                        ⚠️ Distance filtering requires your current address to be set
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={saveAllSettings}
                  disabled={savingSettings}
                  className="roomzi-gradient"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative shadow-lg">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setPreviewUrl(null)}>
              <X className="w-6 h-6" />
            </button>
            <h4 className="mb-4 font-semibold text-lg">{previewName}</h4>
            {previewType === 'image' && (
              <img src={previewUrl} alt="Document Preview" className="max-h-[70vh] mx-auto" />
            )}
            {previewType === 'pdf' && (
              <iframe src={previewUrl} title="PDF Preview" className="w-full h-[70vh] border rounded" />
            )}
            {previewType === 'other' && (
              <div className="text-center">
                <p className="mb-2">Preview not available for this file type.</p>
              </div>
            )}
            {/* Download button for all types */}
            <div className="mt-4 text-center">
              <a
                href={previewUrl}
                download={previewName || 'document'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantProfile;
