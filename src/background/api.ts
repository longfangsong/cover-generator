import { Task } from "@/models/generationTask";
import { PDFExportRequest, PDFExportResponse } from "@/models/pdfExport";
import browser from "webextension-polyfill";


export type ExportPDFMessage = {
  type: 'EXPORT_PDF';
  payload: PDFExportRequest;
};

export type GenerateCoverLetterMessage = {
  type: 'GENERATE_COVER_LETTER';
  payload: Task;
};

export type Message = ExportPDFMessage | GenerateCoverLetterMessage;

export function isExportPDFMessage(message: Message): message is ExportPDFMessage {
  return message.type === 'EXPORT_PDF';
}

export function isGenerateCoverLetterMessage(message: Message): message is GenerateCoverLetterMessage {
  return message.type === 'GENERATE_COVER_LETTER';
}

/**
 * API client for communicating with the background script
 */
export const api = {
  /**
   * Generate a PDF with the given cover letter content
   */
  async exportPDF(payload: PDFExportRequest): Promise<PDFExportResponse | Error> {
    const message: ExportPDFMessage = {
      type: 'EXPORT_PDF',
      payload,
    };
    return browser.runtime.sendMessage(message);
  },

  /**
   * Start a generation job in the background
   */
  async generateCoverLetter(task: Task): Promise<void | Error> {
    const message: GenerateCoverLetterMessage = {
      type: 'GENERATE_COVER_LETTER',
      payload: task,
    };
    return browser.runtime.sendMessage(message);
  }
}
