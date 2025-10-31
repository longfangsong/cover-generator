import { JobDetails } from "@/models/jobDetails";
import browser from "webextension-polyfill";

export type JobInfoMessage = {
  type: 'EXTRACT_JOB_DETAILS';
};

export type Message = JobInfoMessage;

export const api = {
  extractJobDetails: async (): Promise<JobDetails | Error> => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      return new Error('No active tab found');
    }
    try {
      return await browser.tabs.sendMessage(tabs[0].id, {
        type: 'EXTRACT_JOB_DETAILS',
      });
    } catch (error) {
      return new Error('Failed to extract job details from the page, please refresh the page and try again.');
    }
  },
}