import { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Spinner } from '../../components/ui/spinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/ui/accordion';
import { browserStorageService } from '@/infra/storage';
import { Task, Status } from '@/models/generationTask';
import { CoverLetterContent } from '@/models/coverLetterContent';
import { Button } from '../../components/ui/button';
import { exportPDF } from '@/services/pdfExporter';
import { api } from '@/background/api';
import TaskDetails from './details';

const statusMap: Record<Status, { label: string; color: string }> = {
  [Status.PENDING]: { label: 'Pending', color: 'secondary' },
  [Status.IN_PROGRESS]: { label: 'In Progress', color: 'default' },
  [Status.COMPLETED]: { label: 'Completed', color: 'default' },
  [Status.FAILED]: { label: 'Failed', color: 'destructive' },
  [Status.CANCELLED]: { label: 'Cancelled', color: 'outline' },
};

// // todo: introduce data-fns
// function formatDate(date: Date | string) {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   const now = new Date();
//   const diffMs = now.getTime() - d.getTime();
//   const diffMins = Math.floor(diffMs / 60000);
//   if (diffMins < 1) return 'Just now';
//   if (diffMins < 60) return `${diffMins}m ago`;
//   const diffHours = Math.floor(diffMins / 60);
//   if (diffHours < 24) return `${diffHours}h ago`;
//   const diffDays = Math.floor(diffHours / 24);
//   return `${diffDays}d ago`;
// }

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverLetters, setCoverLetters] = useState<Record<string, CoverLetterContent>>({});


  useEffect(() => {
    let mounted = true;

    async function loadTasksAndLetters() {
      setLoading(true);
      setError(null);
      try {
        const loadedTasks = await browserStorageService.listGenerationTasks();
        if (!mounted) return;
        setTasks(loadedTasks);
        const coverLetters = await browserStorageService.listCoverLetters();
        if (!mounted) return;
        setCoverLetters(coverLetters);
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || 'Failed to load tasks');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTasksAndLetters();

    async function handleUpdate() {
      console.log('Generation task updated, reloading tasks...');
      const loadedTasks = await browserStorageService.listGenerationTasks();
      setTasks(loadedTasks);
      const letters = await browserStorageService.listCoverLetters();
      if (letters && mounted) {
        setCoverLetters(letters);
      }
    }
    browserStorageService.onChange(handleUpdate);

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="mr-2" /> Loading tasks...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!tasks.length) {
    return (
      <div className="my-4">
        <div className="text-muted-foreground text-center">No tasks found.</div>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full p-4 mb-12">
      {tasks.map(task => (
        <AccordionItem key={task.id} value={task.id}>
          <AccordionTrigger className="flex flex-row items-center gap-4">
            <div className="flex flex-col items-start flex-1 min-w-0 max-w-66 overflow-scroll">
              <span className="font-medium text-base truncate">{task.position}</span>
              <span className="text-muted-foreground text-xs truncate">{task.company}</span>
            </div>
            <div className="shrink-0 flex items-center">
              <Badge variant={statusMap[task.status]?.color as 'secondary' | 'default' | 'destructive' | 'outline' | undefined}>
                {statusMap[task.status]?.label || task.status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            <TaskDetails 
              task={task} 
              coverLetter={task.coverLetterId ? coverLetters[task.coverLetterId] : undefined} 
              onCoverLetterChange={(updated) => {
                browserStorageService.saveCoverLetter(updated);
              }}
              />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}