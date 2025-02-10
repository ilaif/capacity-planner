import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { Button } from '@/components/ui/button';
import { Plus, X, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/services/loggerService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { PROJECT_COLORS } from '@/lib/colors';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().default(''),
  color: z.string().min(1, 'Color is required'),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

type ProjectFormProps = {
  initialData?: ProjectFormData;
  onSubmit: (data: ProjectFormData) => void;
  onClose: () => void;
};

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSubmit, onClose }) => {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialData ?? {
      name: '',
      description: '',
      color: PROJECT_COLORS[0].value,
    },
  });

  const handleSubmit = async (data: ProjectFormData) => {
    onSubmit(data);
    onClose();
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map(({ value, bgClass }) => (
                    <button
                      type="button"
                      key={value}
                      className={cn(
                        bgClass,
                        'w-6 h-6 rounded-full',
                        field.value === value && 'ring-2 ring-offset-2 ring-black dark:ring-white'
                      )}
                      onClick={() => field.onChange(value)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
};

export const ProjectConfiguration: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<number | null>(null);
  const { planState, setProjects } = usePlannerStore();
  const { projects } = planState;

  const handleProjectAdd = (data: ProjectFormData) => {
    logger.info('Adding project', { data });
    const newId = Math.max(0, ...projects.map(p => p.id)) + 1;
    const newProject = {
      ...data,
      id: newId,
    };
    setProjects([...projects, newProject]);
    setIsOpen(false);
  };

  const handleProjectUpdate = (projectId: number, data: ProjectFormData) => {
    logger.info('Updating project', { projectId, data });
    const newProjects = projects.map(p => (p.id === projectId ? { ...p, ...data } : p));
    setProjects(newProjects);
    setEditingProject(null);
  };

  const handleProjectRemove = (projectId: number) => {
    logger.info('Removing project', { projectId });
    const newProjects = projects.filter(p => p.id !== projectId);
    // Update features to remove project reference
    const { features } = planState;
    const newFeatures = features.map(f =>
      f.projectId === projectId ? { ...f, projectId: null } : f
    );
    usePlannerStore.setState(state => ({
      ...state,
      planState: {
        ...state.planState,
        projects: newProjects,
        features: newFeatures,
      },
    }));
  };

  const handleSubmit = (data: ProjectFormData) => {
    if (editingProject !== null) {
      handleProjectUpdate(editingProject, data);
    } else {
      handleProjectAdd(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project</DialogTitle>
            </DialogHeader>
            <ProjectForm onSubmit={handleSubmit} onClose={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map(project => {
          const colorConfig =
            PROJECT_COLORS.find(c => c.value === project.color) ?? PROJECT_COLORS[0];
          return (
            <div
              key={project.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                colorConfig.bgClass
              )}
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <Dialog
                  open={editingProject === project.id}
                  onOpenChange={open => {
                    if (!open) setEditingProject(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={() => setEditingProject(project.id)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <ProjectForm
                      initialData={project}
                      onSubmit={handleSubmit}
                      onClose={() => setEditingProject(null)}
                    />
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="ghost" onClick={() => handleProjectRemove(project.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
