import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Camera, FileText, Settings, UserCheck, Loader2, Upload, Save, X, Download, Trash2, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { tenantApi, landlordApi, ApiError, imageUtils, documentUtils } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';
import { Switch } from '@/components/ui/switch';

interface LandlordProfileData {
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
}

const LandlordProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [profileData, setProfileData] = useState<LandlordProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [documents, setDocuments] = useState<{ path: string; displayName: string }[]>([]);
  // Add state for document upload
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocName, setNewDocName] = useState("");

  // Add preview modal state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  // Remove localStorage state and add API-based state
  const [viewingRequestNotifications, setViewingRequestNotifications] = useState(true);
  const [rentReminderDays, setRentReminderDays] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Add function to save settings via API
  const saveSettings = async () => {
    if (!user?.id) return;
    
    setSavingSettings(true);
    try {
      const updateResult = await landlordApi.update(user.id, {
        viewingRequestNotifications,
        rentReminderDays,
      });

      if (updateResult.success) {
        toast({
          title: "Settings Saved",
          description: "Your notification preferences have been updated.",
          variant: "default",
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

  // Update useEffect to fetch settings from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await landlordApi.getById(user.id);
        
        if (result.success && result.data) {
          setProfileData(result.data.data);
          setDocuments(result.data.data.documents || []);
          setFormData({
            full_name: result.data.data.full_name || '',
            email: result.data.data.email || '',
            phone: result.data.data.phone || '',
            address: result.data.data.address || '',
          });
          // Set settings from API response
          setViewingRequestNotifications(result.data.data.viewingRequestNotifications ?? true);
          setRentReminderDays(result.data.data.rentReminderDays ?? 3);
        } else {
          // Profile doesn't exist, create a basic one with user's auth data
          const createResult = await landlordApi.create(user.id, user.email || '', user.user_metadata);
          if (createResult.success && createResult.data) {
            setProfileData(createResult.data.data);
            setDocuments(createResult.data.data.documents || []);
            setFormData({
              full_name: createResult.data.data.full_name || '',
              email: createResult.data.data.email || '',
              phone: createResult.data.data.phone || '',
              address: createResult.data.data.address || '',
            });
            // Set settings from created profile
            setViewingRequestNotifications(createResult.data.data.viewingRequestNotifications ?? true);
            setRentReminderDays(createResult.data.data.rentReminderDays ?? 3);
            setEditMode(true); // Automatically enter edit mode for new profiles
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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

  // Refresh profile data when component is focused (to show synced data from tenant profile)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && !loading && !saving && !switching) {
        // Silently refresh the profile data
        landlordApi.getById(user.id).then(result => {
          if (result.success && result.data) {
            setProfileData(result.data.data);
            setDocuments(result.data.data.documents || []);
            if (!editMode) {
              setFormData({
                full_name: result.data.data.full_name || '',
                email: result.data.data.email || '',
                phone: result.data.data.phone || '',
                address: result.data.data.address || '',
              });
            }
          }
        }).catch(error => {
          console.log('Background refresh failed:', error);
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading, saving, switching, editMode]);

  const handleSwitchToTenant = async () => {
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
      console.log('Switching to tenant role...');
      
      // Step 1: Create tenant profile if needed using centralized API
      const profileResult = await tenantApi.create(user.id, user.email || '', user.user_metadata);
      
      if (profileResult.success) {
        if (profileResult.alreadyExists) {
          console.log('✅ Tenant profile already exists - user can proceed');
        } else {
          console.log('✅ New tenant profile created successfully');
        }
      }
      
      // Step 2: Update Supabase metadata
      await updateUserMetadata('tenant');
      
      // Step 3: Update local role
      setUserRole('tenant');
      
      // Step 4: Show success and navigate
      toast({
        title: "Role Switched",
        description: "Welcome to your tenant dashboard!",
        variant: "default",
      });
      
      // Navigate and force refresh to show latest synced data
      navigate('/tenant');
      window.location.reload();
      
    } catch (error) {
      console.error('Error switching to tenant:', error);
      
      let errorMessage = "Unable to switch to tenant role. Please try again.";
      
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingImage(true);
    
    try {
      // Upload image using utility function
      const imageUrl = await imageUtils.uploadProfileImage(file, user.id);

      // Update profile with all shared fields to trigger backend sync
      const updateResult = await landlordApi.update(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        image_url: imageUrl
      });

      if (updateResult.success) {
        // Always fetch the latest profile data after update
        const refreshed = await landlordApi.getById(user.id);
        if (refreshed.success && refreshed.data) {
          setProfileData(refreshed.data.data);
          setFormData({
            full_name: refreshed.data.data.full_name || '',
            email: refreshed.data.data.email || '',
            phone: refreshed.data.data.phone || '',
            address: refreshed.data.data.address || '',
          });
        }
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Update handleDocumentUpload to use display name
  const handleDocumentUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newDocFile || !user?.id || !newDocName.trim()) return;
    setUploadingDocument(true);
    try {
      const documentPath = await documentUtils.uploadDocument(newDocFile, user.id, newDocName);
      const newDocObj = { path: documentPath, displayName: newDocName };
      const newDocuments = [...(profileData?.documents || []), newDocObj];
      console.log('Sending documents to API:', newDocuments);
      const updateResult = await landlordApi.update(user.id, { documents: newDocuments });
      if (updateResult.success) {
        setDocuments(newDocuments);
        setProfileData(prev => prev ? { ...prev, documents: newDocuments } : null);
        setNewDocFile(null);
        setNewDocName("");
        toast({ title: "Success", description: `Document uploaded successfully!`, variant: "default" });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: (error as Error)?.message || "Failed to upload document.", variant: "destructive" });
    } finally {
      setUploadingDocument(false);
    }
  };

  // Update handleDocumentDelete to use document object
  const handleDocumentDelete = async (docObj: { path: string; displayName: string }) => {
    if (!user?.id) return;
    try {
      await documentUtils.deleteDocument(docObj.path);
      const newDocuments = (profileData?.documents || []).filter(d => d.path !== docObj.path);
      const updateResult = await landlordApi.update(user.id, { documents: newDocuments });
      if (updateResult.success) {
        setDocuments(newDocuments);
        setProfileData(prev => prev ? { ...prev, documents: newDocuments } : null);
        toast({ title: "Success", description: "Document deleted successfully!", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Delete Failed", description: (error as Error)?.message || "Failed to delete document.", variant: "destructive" });
    }
  };

  // Update handleDocumentView to show modal preview
  const handleDocumentView = async (docObj: { path: string; displayName: string }) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data } = await supabase.storage.from('documents').createSignedUrl(docObj.path, 60);
      if (data?.signedUrl) {
        const ext = docObj.path.split('.').pop()?.toLowerCase();
        let type = '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext!)) type = 'image';
        else if (['pdf'].includes(ext!)) type = 'pdf';
        else type = 'other';
        setPreviewType(type);
        setPreviewUrl(data.signedUrl);
        setPreviewName(docObj.displayName || docObj.path.split('/').pop() || 'Document');
      } else {
        throw new Error('Failed to get signed URL');
      }
    } catch (error) {
      toast({ title: "View Failed", description: "Failed to open document. Please try again.", variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    
    try {
      const updateResult = await landlordApi.update(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
      });

      if (updateResult.success) {
        // Always fetch the latest profile data after update
        const refreshed = await landlordApi.getById(user.id);
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
        toast({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save profile changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
                onClick={() => navigate('/landlord')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Profile</h1>
            </div>
            <Badge className="bg-green-100 text-green-800">Landlord</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={profileData?.image_url || undefined} 
                  alt={profileData?.full_name || 'Profile'}
                />
                <AvatarFallback className="bg-gray-200 text-gray-500 text-xl">
                  {profileData?.full_name ? profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="w-12 h-12" />}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="profile-image-upload">
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  disabled={uploadingImage}
                  asChild
                >
                  <span>
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </span>
                </Button>
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData?.full_name || 'Landlord'}
              </h2>
              <p className="text-gray-600">{profileData?.email}</p>
              {profileData?.phone && (
                <p className="text-gray-600">{profileData.phone}</p>
              )}
              {profileData?.address && (
                <p className="text-gray-600">{profileData.address}</p>
              )}
              <Badge className="mt-2 bg-green-100 text-green-800">Verified Landlord</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSwitchToTenant}
                variant="outline"
                className="flex items-center"
                disabled={switching}
              >
                {switching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                {switching ? 'Switching...' : 'Switch to Tenant'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
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
                    onClick={handleSaveProfile}
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
                  Phone Number
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
                  Address
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
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              {/* a) Viewing Request Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Viewing Request Notifications</h4>
                  <p className="text-sm text-gray-600">Enable notifications for new viewing requests</p>
                </div>
                <Switch
                  checked={viewingRequestNotifications}
                  onCheckedChange={setViewingRequestNotifications}
                />
              </div>
              {/* b) Rent Due Reminder Days */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Rent Due Reminder</h4>
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
              {/* Save Settings Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={saveSettings}
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

export default LandlordProfile;
