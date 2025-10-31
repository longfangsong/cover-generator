import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import browser from 'webextension-polyfill';
import { toast } from 'sonner';
import { JobDetails, JobPlatform } from '@/models/jobDetails';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { Input } from '@/popup/components/ui/input';
import { Label } from '@/popup/components/ui/label';
import { Textarea } from '@/popup/components/ui/textarea';
import { Badge } from '@/popup/components/ui/badge';
import { Button } from '@/popup/components/ui/button';
import { Spinner } from '@/popup/components/ui/spinner';
import { Alert, AlertDescription } from '@/popup/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { api as contentScript } from '@/content/api';
import { api } from '@/background/api';
import { browserStorageService } from '@/infra/storage';
import { createTask } from '@/models/generationTask';
import { SectionInstructions } from '@/services/coverLetterGeneration/prompt';

export default function Job() {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [instructions, setInstructions] = useState<SectionInstructions>({});
  const navigate = useNavigate();

  // On mount: get current tab URL and try extract job details
  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
        }
      })
      .catch(err => {
        console.error('[Job] Failed to get current tab:', err);
      });
    // Try extract job details once on mount
    handleExtractJob();
  }, []);

  const handleExtractJob = async () => {
    setIsExtracting(true);
    setError(null);

    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      console.log('[Job] Active tabs:', tabs);
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const currentTabUrl = tabs[0].url || '';
      const isSupportedPage = currentTabUrl.includes('linkedin.com/jobs') || 
                              currentTabUrl.includes('arbetsformedlingen.se/platsbanken/annonser');
      
      if (!isSupportedPage) {
        throw new Error('Please navigate to a LinkedIn or Arbetsförmedlingen job posting to extract job details');
      }

      const response = await contentScript.extractJobDetails();;
      if (response instanceof Error) {
        setError(response.message);
      } else {
        setJobDetails(response);
        setError(null);
      }
    } catch (err) {
      console.error('[Job] Extraction error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Cannot auto-detect job details. Please enter job information manually.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUpdate = () => {
    const updated: JobDetails = {
      id: jobDetails?.id || crypto.randomUUID(),
      company,
      title,
      description,
      url: jobDetails?.url || currentUrl || window.location.href,
      platform: jobDetails?.platform || JobPlatform.MANUAL,
      extractedAt: jobDetails?.extractedAt || new Date(),
      isManual: !jobDetails || jobDetails.isManual,
    };

    setJobDetails(updated);
  };

  // Update local state when jobDetails changes (after extraction)
  useEffect(() => {
    if (jobDetails) {
      if (jobDetails.company !== company) setCompany(jobDetails.company);
      if (jobDetails.title !== title) setTitle(jobDetails.title);
      if (jobDetails.description !== description) setDescription(jobDetails.description);
    }
  }, [jobDetails?.id]);

  const handleGenerateCoverLetter = async () => {
    try {
      // Validate inputs
      if (!company.trim() || !title.trim() || !description.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!jobDetails) {
        toast.error('Job details not found');
        return;
      }

      const userProfile = await browserStorageService.loadProfile();
      
      if (!userProfile) {
        toast.error('Please create a user profile first');
        return;
      }

      // Load LLM config
      const llmConfig = await browserStorageService.loadLLMSettings();

      // Update jobDetails with latest form values
      const updatedJobDetails: JobDetails = {
        ...jobDetails,
        company,
        title,
        description,
      };

      // Create generation task with instructions and LLM config
      const task = createTask(userProfile, updatedJobDetails, {
        instructions,
        model: llmConfig?.model,
        temperature: llmConfig?.temperature,
        maxTokens: llmConfig?.maxTokens,
      });

      const result = await api.generateCoverLetter(task);
      
      if (result instanceof Error) {
        toast.error(result.message);
      } else {
        toast.success('Cover letter generation started! Check the Generation tab for progress.');
        // Redirect to tasks page
        navigate('/tasks');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start generation');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 mb-12">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Extract job details from the current page or enter them manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(currentUrl.includes('linkedin.com/jobs') || 
            currentUrl.includes('arbetsformedlingen.se/platsbanken/annonser')) && (
            <div className="flex gap-2">
              <Button 
                onClick={handleExtractJob} 
                disabled={isExtracting}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Extract from Current Page'
                )}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company">
              Company <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              onBlur={handleUpdate}
              placeholder="e.g., Google"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleUpdate}
              placeholder="e.g., Senior Software Engineer"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Job Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Paste or enter the job description here..."
              rows={8}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length} / 10,000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation Instructions</CardTitle>
          <CardDescription>
            Customize how the cover letter should be generated (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opening-instruction">Opening Section</Label>
            <Textarea
              value={instructions.opening || ''}
              onChange={e => setInstructions({ ...instructions, opening: e.target.value })}
              placeholder="e.g., Make it warm and engaging, mentioning why I'm excited about this role"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about-me-instruction">About Me Section</Label>
            <Textarea
              value={instructions.aboutMe || ''}
              onChange={e => setInstructions({ ...instructions, aboutMe: e.target.value })}
              placeholder="e.g., Highlight 3-4 most relevant experiences, focus on technical achievements"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="why-me-instruction">Why Me Section</Label>
            <Textarea
              value={instructions.whyMe || ''}
              onChange={e => setInstructions({ ...instructions, whyMe: e.target.value })}
              placeholder="e.g., Emphasize problem-solving skills and leadership experience"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="why-company-instruction">Why Company Section</Label>
            <Textarea
              value={instructions.whyCompany || ''}
              onChange={e => setInstructions({ ...instructions, whyCompany: e.target.value })}
              placeholder="e.g., Research their recent projects and mention what excites you about them"
              rows={3}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <p>💡 Tip: Leave sections blank to use the default generation approach</p>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleGenerateCoverLetter}
        disabled={!company.trim() || !title.trim() || !description.trim()}
        className="w-full"
      >
        Start Cover Letter Generation
      </Button>
    </div>
  );
}