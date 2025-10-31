import browser from "webextension-polyfill";
import { Message } from "./api";
import { exportPDF } from "@/services/pdfExporter";
import { coverLetterGenerationService } from "@/services/generationWorker";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

/**
 * Message handler for communication between content scripts and popup
 */
browser.runtime.onMessage.addListener((msg: unknown) => {
  let message = msg as Message;
  console.log('Background received message:', message);
  switch (message.type) {
    case 'EXPORT_PDF':
      return exportPDF(message.payload);
    case 'GENERATE_COVER_LETTER':
      // Handle cover letter generation
      coverLetterGenerationService.addToQueue(message.payload);
      break;
    default:
      console.log('Unknown message type:', message, "Maybe not for background?");
  }
  return Promise.resolve();
});
