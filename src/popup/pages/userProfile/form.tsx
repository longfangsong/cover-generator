/**
 * Form Component
 * Main form for creating and editing user profile with all fields
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Button } from '@/popup/components/ui/button';
import { Input } from '@/popup/components/ui/input';
import { Label } from '@/popup/components/ui/label';
import { Textarea } from '@/popup/components/ui/textarea';
import { Badge } from '@/popup/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { UserProfile } from '@/models/userProfile';
import { Experience } from '@/models/userProfile/experience';
import { Project } from '@/models/userProfile/project';
import { Education } from '@/models/userProfile/education';
import { validate } from '@/models/userProfile/validate';

interface FormProps {
  initialProfile?: UserProfile | null;
  onSave: (profile: UserProfile) => Promise<void>;
  onCancel?: () => void;
}

export function Form({ initialProfile, onSave, onCancel }: FormProps) {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homepage, setHomepage] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load initial profile data
  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setEmail(initialProfile.email);
      setPhone(initialProfile.phone || '');
      setHomepage(initialProfile.homepage || '');
      setGithub(initialProfile.github || '');
      setLinkedin(initialProfile.linkedin || '');
      setExperience(initialProfile.experience);
      setProjects(initialProfile.projects || []);
      setEducation(initialProfile.education);
      setSkills(initialProfile.skills);
    }
  }, [initialProfile]);

  const createEmptyExperience = (): Experience => ({
    id: crypto.randomUUID(),
    role: '',
    startDate: new Date(),
    description: '',
  });

  const createEmptyProject = (): Project => ({
    id: crypto.randomUUID(),
    name: '',
    startDate: new Date(),
    description: '',
  });

  const createEmptyEducation = (): Education => ({
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
  });

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim()) && skills.length < 100) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const profile: UserProfile = {
      id: initialProfile?.id || crypto.randomUUID(),
      name,
      email,
      phone: phone || undefined,
      homepage: homepage || undefined,
      github: github || undefined,
      linkedin: linkedin || undefined,
      experience,
      projects,
      education,
      skills,
      createdAt: initialProfile?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Validate profile
    const validation = validate(profile);
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error: any) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(profile);
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              maxLength={200}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="homepage">Homepage / Portfolio</Label>
            <Input
              id="homepage"
              type="url"
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
            {errors.homepage && <p className="text-sm text-destructive">{errors.homepage}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username or username"
            />
            {errors.github && <p className="text-sm text-destructive">{errors.github}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
            {errors.linkedin && <p className="text-sm text-destructive">{errors.linkedin}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>
            Skills <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>Add your technical and professional skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              placeholder="Enter a skill"
              maxLength={100}
            />
            <Button type="button" onClick={handleAddSkill} disabled={skills.length >= 100}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                <button
                  className="inline-flex items-center"
                  onClick={(e) => {
                    console.log(e);
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveSkill(skill);
                  }}
                >
                  <X className="h-3 w-3 cursor-pointer" />
                </button>
              </Badge>
            ))}
          </div>
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground">No skills added yet</p>
          )}
          {errors.skills && <p className="text-sm text-destructive">{errors.skills}</p>}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Add your professional work history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.length === 0 && (
            <p className="text-sm text-muted-foreground">No work experience added yet</p>
          )}
          {experience.map((exp, index) => (
            <div key={exp.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Experience #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExperience(experience.filter(e => e.id !== exp.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={exp.company || ''}
                    onChange={(evt) =>
                      setExperience(
                        experience.map((e) =>
                          e.id === exp.id ? { ...e, company: evt.target.value } : e
                        )
                      )
                    }
                    placeholder="Company name"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={exp.role}
                    onChange={(evt) =>
                      setExperience(
                        experience.map((e) =>
                          e.id === exp.id ? { ...e, role: evt.target.value } : e
                        )
                      )
                    }
                    placeholder="Job title"
                    required
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={exp.startDate?.toISOString().split('T')[0] || ''}
                      onChange={(evt) =>
                        setExperience(
                          experience.map((e) =>
                            e.id === exp.id
                              ? { ...e, startDate: new Date(evt.target.value) }
                              : e
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={exp.endDate?.toISOString().split('T')[0] || ''}
                      onChange={(evt) =>
                        setExperience(
                          experience.map((e) =>
                            e.id === exp.id
                              ? { ...e, endDate: evt.target.value ? new Date(evt.target.value) : undefined }
                              : e
                          )
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={exp.description}
                    onChange={(evt) =>
                      setExperience(
                        experience.map((e) =>
                          e.id === exp.id ? { ...e, description: evt.target.value } : e
                        )
                      )
                    }
                    placeholder="Describe your responsibilities and achievements"
                    required
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setExperience([...experience, createEmptyExperience()])}
            disabled={experience.length + projects.length >= 15}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Work Experience
          </Button>
          {experience.length + projects.length >= 15 && (
            <p className="text-sm text-amber-600">
              Maximum 15 combined experience and project entries reached
            </p>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Add your personal projects and contributions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects added yet</p>
          )}
          {projects.map((proj, index) => (
            <div key={proj.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Project #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setProjects(projects.filter(p => p.id !== proj.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={proj.name}
                    onChange={(e) =>
                      setProjects(
                        projects.map((p) =>
                          p.id === proj.id ? { ...p, name: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Project name"
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input
                    value={proj.organization || ''}
                    onChange={(e) =>
                      setProjects(
                        projects.map((p) =>
                          p.id === proj.id ? { ...p, organization: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Organization or context"
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={proj.startDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) =>
                        setProjects(
                          projects.map((p) =>
                            p.id === proj.id
                              ? { ...p, startDate: new Date(e.target.value) }
                              : p
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={(proj.endDate && proj.endDate.toISOString().split('T')[0]) || ''}
                      onChange={(e) =>
                        setProjects(
                          projects.map((p) =>
                            p.id === proj.id
                              ? { ...p, endDate: e.target.value ? new Date(e.target.value) : undefined }
                              : p
                          )
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={proj.description}
                    onChange={(e) =>
                      setProjects(
                        projects.map((p) =>
                          p.id === proj.id ? { ...p, description: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Describe the project and your contributions"
                    required
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setProjects([...projects, createEmptyProject()])}
            disabled={experience.length + projects.length >= 15}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
          {experience.length === 0 && projects.length === 0 && (
            <p className="text-sm text-destructive">
              At least one work experience or project entry is required
            </p>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
          <CardDescription>Add your educational background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.map((edu, index) => (
            <div key={edu.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Education #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEducation(education.filter(e => e.id !== edu.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Institution <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={edu.institution}
                    onChange={(evt) =>
                      setEducation(
                        education.map((e) =>
                          e.id === edu.id ? { ...e, institution: evt.target.value } : e
                        )
                      )
                    }
                    placeholder="University name"
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Degree <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={edu.degree}
                    onChange={(evt) =>
                      setEducation(
                        education.map((e) =>
                          e.id === edu.id ? { ...e, degree: evt.target.value } : e
                        )
                      )
                    }
                    placeholder="B.S. Computer Science"
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field || ''}
                    onChange={(evt) =>
                      setEducation(
                        education.map((e) =>
                          e.id === edu.id ? { ...e, field: evt.target.value } : e
                        )
                      )
                    }
                    placeholder="Computer Science"
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={edu.startDate?.toISOString().split('T')[0] || ''}
                      onChange={(evt) =>
                        setEducation(
                          education.map((e) =>
                            e.id === edu.id
                              ? { ...e, startDate: evt.target.value ? new Date(evt.target.value) : undefined }
                              : e
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={edu.endDate?.toISOString().split('T')[0] || ''}
                      onChange={(evt) =>
                        setEducation(
                          education.map((e) =>
                            e.id === edu.id
                              ? { ...e, endDate: evt.target.value ? new Date(evt.target.value) : undefined }
                              : e
                          )
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setEducation([...education, createEmptyEducation()])}
            disabled={education.length >= 10}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
          {education.length >= 10 && (
            <p className="text-sm text-amber-600">Maximum 10 education entries reached</p>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}