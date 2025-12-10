'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  XMarkIcon, 
  UserCircleIcon,
  DocumentTextIcon,
  PaperClipIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { Technician, technicianService } from '@/services/technicianService';

type CreateTechnicianRequest = Omit<Technician, 'id' | 'tenantId' | 'rating' | 'skills' | 'specialty' | 'certifications'> & {
  isActive: boolean;
  skills: string;
  specialty: string;
  certifications: string;
};

export default function CreateTechnicianPage() {
  // ...existing state and hook declarations...

  // All hooks and state above

  // Submit handler for creating/updating a technician
  const handleSubmit = () => {
    if (!isOnline) {
      alert(`Cannot ${technicianId ? 'update' : 'create'} technicians while offline. Please check your connection.`);
      return;
    }
    if (validateForm()) {
      // Map frontend fields to backend OData schema
      const technicianData = {
        name,
        email,
        phone,
        role,
        bio,
        hireDate,
        yearsOfExperience,
        isActive,
        // profileImage is omitted as it's not used by the endpoint
        skills: skills.toString(),
        specialty: specialty.toString(),
        certifications: certifications.toString(),
      };
      
      if (technicianId) {
        // Update existing technician
        console.log('Technician PATCH payload:', JSON.stringify(technicianData, null, 2));
        updateTechnicianMutation.mutate({ id: technicianId, data: technicianData });
      } else {
        // Create new technician
        console.log('Technician POST payload:', JSON.stringify(technicianData, null, 2));
        createTechnicianMutation.mutate(technicianData);
      }
    }
  };
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const technicianId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [profileImage, setProfileImage] = useState('');
  const [skills, setSkills] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [certifications, setCertifications] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [privateNotes, setPrivateNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch technician data if ID is present (fallback if cache fails)
  const { data: technicianDataFromApi } = useQuery({
    queryKey: ['technician', technicianId],
    queryFn: () => technicianService.getTechnicianById(technicianId!),
    enabled: false, // Don't auto-fetch, we'll fetch manually if cache fails
  });

  // Get technician data from cache if ID is present (don't make API call)
  useEffect(() => {
    if (technicianId) {
      console.log('[Create Page] Loading technician from cache:', technicianId);
      
      // Get cached technicians list
      const cachedTechnicians = queryClient.getQueryData<Technician[]>(['technicians']);
      
      if (cachedTechnicians) {
        // Find the technician in cache by ID
        const technicianData = cachedTechnicians.find(tech => tech.id === technicianId);
        
        if (technicianData) {
          console.log('[Create Page] Found technician in cache:', technicianData);
          
          setName(technicianData.name || '');
          setEmail(technicianData.email || '');
          setPhone(technicianData.phone || '');
          setRole(technicianData.role || '');
          setBio(technicianData.bio || '');
          setHireDate(technicianData.hireDate || '');
          setYearsOfExperience(technicianData.yearsOfExperience || 0);
          setIsActive(technicianData.status === 'Active');
          setProfileImage(technicianData.profileImage || '');
          
          // Handle skills, specialty, certifications - they can be arrays or strings
          if (technicianData.skills) {
            const skillsStr = Array.isArray(technicianData.skills) ? technicianData.skills.join(', ') : String(technicianData.skills);
            console.log('[Create Page] Setting skills:', skillsStr);
            setSkills(skillsStr);
          }
          if (technicianData.specialty) {
            const specialtyStr = Array.isArray(technicianData.specialty) ? technicianData.specialty.join(', ') : String(technicianData.specialty);
            console.log('[Create Page] Setting specialty:', specialtyStr);
            setSpecialty(specialtyStr);
          }
          if (technicianData.certifications) {
            const certificationsStr = Array.isArray(technicianData.certifications) ? technicianData.certifications.join(', ') : String(technicianData.certifications);
            console.log('[Create Page] Setting certifications:', certificationsStr);
            setCertifications(certificationsStr);
          }
          
          console.log('[Create Page] Form fields set from cache:', { name: technicianData.name, email: technicianData.email, phone: technicianData.phone, role: technicianData.role });
        } else {
          console.log('[Create Page] Technician not found in cache, fetching from API');
          // Fetch from API if not in cache
          queryClient.fetchQuery({
            queryKey: ['technician', technicianId],
            queryFn: () => technicianService.getTechnicianById(technicianId),
          });
        }
      } else {
        console.log('[Create Page] No cached technicians found, fetching from API');
        // Fetch from API if cache is empty
        queryClient.fetchQuery({
          queryKey: ['technician', technicianId],
          queryFn: () => technicianService.getTechnicianById(technicianId),
        });
      }
    }
  }, [technicianId, queryClient]);

  // Pre-fill form when API data is loaded (fallback)
  useEffect(() => {
    if (technicianDataFromApi) {
      console.log('[Create Page] Received technician data from API:', technicianDataFromApi);
      
      setName(technicianDataFromApi.name || '');
      setEmail(technicianDataFromApi.email || '');
      setPhone(technicianDataFromApi.phone || '');
      setRole(technicianDataFromApi.role || '');
      setBio(technicianDataFromApi.bio || '');
      setHireDate(technicianDataFromApi.hireDate || '');
      setYearsOfExperience(technicianDataFromApi.yearsOfExperience || 0);
      setIsActive(technicianDataFromApi.status === 'Active');
      setProfileImage(technicianDataFromApi.profileImage || '');
      
      // Handle skills, specialty, certifications - they can be arrays or strings
      if (technicianDataFromApi.skills) {
        const skillsStr = Array.isArray(technicianDataFromApi.skills) ? technicianDataFromApi.skills.join(', ') : String(technicianDataFromApi.skills);
        console.log('[Create Page] Setting skills from API:', skillsStr);
        setSkills(skillsStr);
      }
      if (technicianDataFromApi.specialty) {
        const specialtyStr = Array.isArray(technicianDataFromApi.specialty) ? technicianDataFromApi.specialty.join(', ') : String(technicianDataFromApi.specialty);
        console.log('[Create Page] Setting specialty from API:', specialtyStr);
        setSpecialty(specialtyStr);
      }
      if (technicianDataFromApi.certifications) {
        const certificationsStr = Array.isArray(technicianDataFromApi.certifications) ? technicianDataFromApi.certifications.join(', ') : String(technicianDataFromApi.certifications);
        console.log('[Create Page] Setting certifications from API:', certificationsStr);
        setCertifications(certificationsStr);
      }
      
      console.log('[Create Page] Form fields set from API:', { name: technicianDataFromApi.name, email: technicianDataFromApi.email, phone: technicianDataFromApi.phone, role: technicianDataFromApi.role });
    }
  }, [technicianDataFromApi]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const createTechnicianMutation = useMutation({
    mutationFn: (techData: CreateTechnicianRequest) => technicianService.createTechnician(techData),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/technicians');
      }, 1500);
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error: any) => {
      console.error('Failed to create technician:', error);
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTechnicianRequest }) => 
      technicianService.updateTechnician(id, data),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/technicians');
      }, 1500);
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error: any) => {
      console.error('Failed to update technician:', error);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!role.trim()) {
      newErrors.role = 'Role is required';
    }

    if (!hireDate) {
      newErrors.hireDate = 'Hire date is required';
    }

    if (!skills.trim()) {
      newErrors.skills = 'At least one skill is required';
    }
    if (!specialty.trim()) {
      newErrors.specialty = 'At least one specialty is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showSuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg text-lg font-semibold">
          Technician saved successfully!
        </div>
      )}
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/technicians')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{technicianId ? 'View Technician' : 'Add Technician'}</h1>
              {!isOnline && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Offline
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm rounded-full ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <Button onClick={handleSubmit} disabled={createTechnicianMutation.isPending || updateTechnicianMutation.isPending || !isOnline}>
                {(createTechnicianMutation.isPending || updateTechnicianMutation.isPending) ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {/* Profile Picture */}
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3 relative">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover rounded-lg" />
              ) : (
                <UserCircleIcon className="h-24 w-24 text-gray-400" />
              )}
            </div>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Profile image URL..."
            />
          </div>

          {/* Private Notes */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setActiveSection(activeSection === 'notes' ? null : 'notes')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Private notes</span>
              </div>
              <PlusIcon className="h-5 w-5 text-gray-400" />
            </button>
            {activeSection === 'notes' && (
              <div className="px-4 pb-4">
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={4}
                  placeholder="Add private notes..."
                />
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="border-b border-gray-200">
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <PaperClipIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Attachments</span>
              </div>
              <PlusIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-6">
            {/* Personal Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-4">
                <UserCircleIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    placeholder="Enter technician name..."
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    placeholder="Email address"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    placeholder="Phone number"
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Is Active</label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="isActive"
                        checked={isActive === true}
                        onChange={() => setIsActive(true)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="isActive"
                        checked={isActive === false}
                        onChange={() => setIsActive(false)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Info Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-4">
                <BriefcaseIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Professional Information</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Role *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    placeholder="e.g., Senior Technician"
                  />
                  {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hire Date *</label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  />
                  {errors.hireDate && <p className="text-xs text-red-600 mt-1">{errors.hireDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  rows={3}
                  placeholder="Brief bio or description..."
                />
              </div>
            </div>

            {/* Skills Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Skills *</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  placeholder="Comma-separated skills (e.g., HVAC, Electrical, Plumbing)"
                />
                {errors.skills && <p className="text-sm text-red-600 mb-2">{errors.skills}</p>}
              </div>
            </div>

            {/* Specialty Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Specialty Areas *</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  placeholder="Comma-separated specialties (e.g., Commercial HVAC, Residential)"
                />
                {errors.specialty && <p className="text-sm text-red-600 mb-2">{errors.specialty}</p>}
              </div>
            </div>

            {/* Certifications Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Certifications & Licenses</h3>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  placeholder="Comma-separated certifications (e.g., EPA 608, NATE Certified)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
