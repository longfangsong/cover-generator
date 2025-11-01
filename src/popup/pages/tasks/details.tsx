import React from 'react';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { toast } from "sonner";
import { browserStorageService } from '@/infra/storage';
import { exportPDF } from '@/services/pdfExporter';
import { api } from '@/background/api';
import { Task, Status } from '@/models/generationTask';
import { CoverLetterContent } from '@/models/coverLetterContent';

interface TaskDetailsProps {
    task: Task;
    coverLetter?: CoverLetterContent;
    onCoverLetterChange?: (updatedLetter: CoverLetterContent) => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, coverLetter, onCoverLetterChange }) => {
    const [currentCoverLetter, setCurrentCoverLetter] = React.useState<CoverLetterContent | undefined>(coverLetter);
    const sectionLabels = {
        opening: 'Opening',
        aboutMe: 'About Me',
        whyMe: 'Why I am a Good Fit',
        whyCompany: 'Why This Company',
    };

    async function handleExportPDF(task: Task, coverLetter: CoverLetterContent) {
        const profile = task.profile || {};
        const job = task.jobDetails || {};
        const response = await exportPDF({
            first_name: profile.name?.split(' ')[0] || '',
            last_name: profile.name?.split(' ').slice(1).join(' ') || '',
            email: profile.email || '',
            phone: profile.phone || '',
            position: job.title || task.position || '',
            addressee: coverLetter.addressee || 'Hiring Manager',
            opening: coverLetter.opening || '',
            about_me: coverLetter.aboutMe || '',
            why_me: coverLetter.whyMe || '',
            why_company: coverLetter.whyCompany || '',
        });
        if (response instanceof Error) {
            return;
        }
        let filename = response.suggestedFilename;
        if (!filename) {
            const date = new Date().toISOString().split('T')[0];
            const companyName = (task.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
            filename = `CoverLetter_${companyName}_${date}.pdf`;
        }
        if (response.pdfData) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${response.pdfData}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const retryTask = async () => {
        const newTask = {
            ...task,
            id: crypto.randomUUID(),
            status: Status.PENDING,
            error: undefined,
            createdAt: new Date(),
            startedAt: undefined,
            completedAt: undefined,
            coverLetterId: undefined,
        };
        await browserStorageService.saveGenerationTask(newTask);
        api.generateCoverLetter(newTask);
    };

    return (
        <>
            <div className="text-xs text-muted-foreground mb-2">Created {new Date(task.createdAt).toLocaleString()}</div>
            {task.error && (
                <Alert variant="destructive">
                    <AlertDescription>Error: {task.error}</AlertDescription>
                </Alert>
            )}
            {task.coverLetterId && coverLetter && (
                <div className="bg-muted rounded p-4 flex flex-col gap-6">
                    {(['opening', 'aboutMe', 'whyMe', 'whyCompany'] as const).map(section => (
                        <div key={section} className="flex flex-col gap-1">
                            <div className="font-semibold text-sm">
                                {sectionLabels[section]}
                            </div>
                            <Textarea
                                value={currentCoverLetter?.[section] || ''}
                                onChange={e => {
                                    console.log(e.target.value);
                                    const newContent = {
                                        ...currentCoverLetter,
                                        [section]: e.target.value,
                                    } as CoverLetterContent;
                                    setCurrentCoverLetter(newContent);
                                }}
                                onBlur={e => {
                                    onCoverLetterChange?.(currentCoverLetter!);
                                }}
                                rows={5}
                                className="section-editor"
                            />
                        </div>
                    ))}
                </div>
            )}
            {task.coverLetterId && !coverLetter && (
                <div className="text-muted-foreground italic">Cover letter not found.</div>
            )}
            {!task.coverLetterId && (
                <div className="text-muted-foreground italic">No cover letter generated for this task. {task.status === Status.IN_PROGRESS && "Please wait for ~1min and check again."}</div>
            )}
            {task.coverLetterId && coverLetter && (
                <>
                    <Button
                        onClick={async () => {
                            await navigator.clipboard.writeText(`Dear ${coverLetter.addressee},\n\n${coverLetter.opening}\n\n${coverLetter.aboutMe}\n\n${coverLetter.whyMe}\n\n${coverLetter.whyCompany}\n\nSincerely,\n${task.profile?.name}`);
                            toast.success("Copied cover letter to clipboard!");
                        }}
                    >
                        Copy to Clipboard
                    </Button>
                    <Button
                        onClick={async () => {
                            await handleExportPDF(task, coverLetter!);
                            toast.success("Exported cover letter as PDF!");
                        }}
                    >
                        Export PDF
                    </Button>
                </>
            )}
            {task.status === Status.FAILED && (
                <Button onClick={retryTask}>
                    Retry
                </Button>
            )}
            <Button
                variant="destructive"
                onClick={() => {
                    browserStorageService.deleteGenerationTask(task.id);
                }}
            >
                Delete
            </Button>
        </>
    );
};

export default TaskDetails;