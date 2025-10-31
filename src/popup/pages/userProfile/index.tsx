import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserProfile as UserProfileType } from '@/models/userProfile';
import { browserStorageService } from '@/infra/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import PDFUpload from './pdfUpload';
import { Form } from './form';

const storageService = browserStorageService;

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const loadedProfile = await storageService.loadProfile();
      setProfile(loadedProfile);
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileExtracted = (extractedProfile: Partial<UserProfileType>) => {
    // Merge extracted profile with existing profile
    if (profile) {
      setProfile({
        ...profile,
        ...extractedProfile,
        // Preserve ID and timestamps from existing profile
        id: profile.id,
        createdAt: profile.createdAt,
        updatedAt: new Date(),
      });
    } else {
      // Create new profile with extracted data
      setProfile({
        id: crypto.randomUUID(),
        name: extractedProfile.name || '',
        email: extractedProfile.email || '',
        phone: extractedProfile.phone,
        homepage: extractedProfile.homepage,
        github: extractedProfile.github,
        linkedin: extractedProfile.linkedin,
        experience: extractedProfile.experience || [],
        projects: extractedProfile.projects || [],
        education: extractedProfile.education || [],
        skills: extractedProfile.skills || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    toast.success('Profile extracted successfully!');
  };

  const handleSave = async (newProfile: UserProfileType) => {
    try {
      await storageService.saveProfile(newProfile);
      setProfile(newProfile);
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error('Failed to save profile');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 mb-12">
      <PDFUpload
        onProfileExtracted={handleProfileExtracted}
        onError={(error) => toast.error(error)}
      />

      <Form
        initialProfile={profile}
        onSave={handleSave}
      />
    </div>
  );
}