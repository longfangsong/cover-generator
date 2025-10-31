/**
 * PDFUpload Component
 * 
 * Allows users to upload a resume PDF for auto-population of profile data.
 * Validates file size and type before processing.
 */

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/popup/components/ui/spinner';
import { pdfParserService, PDFParseError } from '@/infra/pdfParsing';
import { extractProfile } from '@/services/resumeExtractor';
import { UserProfile } from '@/models/userProfile';
import { Label } from '@/popup/components/ui/label';
import { Input } from '@/popup/components/ui/input';
import { Card } from '@/popup/components/ui/card';

interface ExtractFromPDFProps {
  onProfileExtracted: (profile: Partial<UserProfile>) => void;
  onError: (error: string) => void;
}

export default function ExtractFromPDF({ onProfileExtracted, onError }: ExtractFromPDFProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file
    const validation = await pdfParserService.validateFile(file);
    if (!validation.valid) {
      onError(validation.error?.message || 'Invalid file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Process the PDF
    await processPDF(file);
  };

  const processPDF = async (file: File) => {
    setIsProcessing(true);

    try {
      // Step 1: Parse PDF
      const parseResult = await pdfParserService.parseFile(file);

      if (!parseResult.text || parseResult.text.trim().length < 100) {
        throw new Error('PDF appears to be empty or contains too little text');
      }

      // Append links to the text content
      let contentToExtract = parseResult.text;
      if (parseResult.links.length > 0) {
        contentToExtract += '\n\nLinks found in document:\n' + parseResult.links.join('\n');
      }

      // Step 2: Extract profile using AI service
      const extractionResult = await extractProfile(contentToExtract);

      // Step 3: Notify parent with extracted profile
      onProfileExtracted(extractionResult.profile);

      // Show warnings if any
      if (extractionResult.warnings.length > 0) {
        console.warn('Extraction warnings:', extractionResult.warnings);
      }

      // Show confidence level
      if (extractionResult.confidence === 'low') {
        onError('Profile extracted with low confidence. Please review and correct all fields.');
      } else if (extractionResult.confidence === 'medium') {
        console.info('Profile extracted with medium confidence. Please review key fields.');
      }

    } catch (error: any) {
      const pdfError = error as PDFParseError;

      // Handle specific error types
      if (pdfError.type) {
        switch (pdfError.type) {
          case 'file-too-large':
            onError('PDF file is too large. Maximum size is 5MB.');
            break;
          case 'password-protected':
            onError('PDF is password-protected. Please provide an unprotected version.');
            break;
          case 'corrupted':
            onError('PDF file appears to be corrupted or invalid.');
            break;
          case 'invalid-pdf':
            onError('File must be a valid PDF document.');
            break;
          case 'extraction-failed':
          default:
            onError(`Failed to extract from PDF: ${pdfError.message || 'Unknown error'}`);
        }
      } else {
        onError(`Failed to process PDF: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="space-y-4 p-4">
      <div className="grid w-full max-w-sm items-center gap-3">
        <Label htmlFor="picture">Upload your CV to extract information</Label>
        <Input id="picture" type="file" ref={fileInputRef} onChange={handleFileSelect} />
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Spinner className="w-4 h-4 animate-spin text-primary" />
          <span className="font-medium text-sm">Processing...</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1 text-center">
        <p>Maximum file size: 5MB</p>
        <p>Supported format: PDF only</p>
        <p>Depending on the length of your CV, it takes about 1min to extract your information.</p>
      </div>
    </Card>
  );
}