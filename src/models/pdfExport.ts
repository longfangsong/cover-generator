export interface PDFExportRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  addressee: string;
  opening: string;
  about_me: string;
  why_me: string;
  why_company: string;
}


export interface PDFExportResponse {
  pdfData?: string;
  suggestedFilename?: string;
}