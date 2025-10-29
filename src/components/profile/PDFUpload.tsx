/**
 * PDFUpload Component
 * 
 * Allows users to upload a resume PDF for auto-population of profile data.
 * Validates file size and type before processing.
 */

import React, { useState, useRef } from 'react';
import { pdfParserService, PDFParseError } from '../../infra/pdfParsing';
import { extractProfile } from '../../services/resumeExtractor';
import { UserProfile } from '../../models/UserProfile';
import './PDFUpload.css';

interface PDFUploadProps {
  onProfileExtracted: (profile: Partial<UserProfile>) => void;
  onError: (error: string) => void;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({ onProfileExtracted, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    
    // Validate file
    const validation = await pdfParserService.validateFile(file);
    if (!validation.valid) {
      onError(validation.error?.message || 'Invalid file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileName(null);
      return;
    }

    // Process the PDF
    await processPDF(file);
  };

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setExtractionStatus('Reading PDF...');

    try {
      // Step 1: Parse PDF
      const parseResult = await pdfParserService.parseFile(file);
      
      if (!parseResult.text || parseResult.text.trim().length < 100) {
        throw new Error('PDF appears to be empty or contains too little text');
      }

      setExtractionStatus('Extracting profile information...');

      // Step 2: Extract profile using AI service
      const extractionResult = await extractProfile(parseResult.text);

      // Step 3: Notify parent with extracted profile
      setExtractionStatus('Profile extracted successfully!');
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

      setExtractionStatus('');
    } finally {
      setIsProcessing(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileName(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pdf-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        disabled={isProcessing}
        style={{ display: 'none' }}
      />
      
      <button
        className="pdf-upload-button"
        onClick={handleButtonClick}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          <>
            <svg className="upload-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,11L16,15H13.5V19H10.5V15H8L12,11Z" />
            </svg>
            Upload Resume (PDF)
          </>
        )}
      </button>

      {fileName && !isProcessing && (
        <div className="file-name">
          Selected: {fileName}
        </div>
      )}

      {extractionStatus && (
        <div className="extraction-status">
          {extractionStatus}
        </div>
      )}

      <div className="upload-info">
        <p>Maximum file size: 5MB</p>
        <p>Supported format: PDF only</p>
      </div>
    </div>
  );
};
