import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SavedConfiguration,
  getSavedConfigurations,
  saveConfiguration,
  deleteConfiguration,
  updateConfiguration,
} from '@/services/configurationService';
import { PlannerState } from '@/services/stateService';
import { Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { logger } from '@/services/loggerService';

interface ConfigurationManagerProps {
  currentState: PlannerState;
  onConfigurationLoad: (state: PlannerState) => void;
}

export function ConfigurationManager({
  currentState,
  onConfigurationLoad,
}: ConfigurationManagerProps) {
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [newConfigName, setNewConfigName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    logger.info('Loading saved configurations');
    setConfigurations(getSavedConfigurations());
  }, []);

  const handleSaveNewConfiguration = () => {
    if (!newConfigName.trim()) return;

    try {
      logger.info('Saving new configuration', { name: newConfigName });
      const newConfig = saveConfiguration(newConfigName.trim(), currentState);
      setConfigurations(prev => [...prev, newConfig]);
      setNewConfigName('');
      setSaveDialogOpen(false);
      setSelectedConfigId(newConfig.id);
      logger.info('New configuration saved successfully', { configId: newConfig.id });
    } catch (error) {
      logger.error('Failed to save configuration', error as Error, { name: newConfigName });
      alert(error instanceof Error ? error.message : 'Failed to save configuration');
    }
  };

  const handleUpdateConfiguration = () => {
    try {
      logger.info('Updating configuration', { configId: selectedConfigId });
      updateConfiguration(selectedConfigId, currentState);
      setConfigurations(prev =>
        prev.map(config =>
          config.id === selectedConfigId
            ? {
                ...config,
                state: currentState,
                updatedAt: new Date().toISOString(),
              }
            : config
        )
      );
      logger.info('Configuration updated successfully', { configId: selectedConfigId });
    } catch (error) {
      logger.error('Failed to update configuration', error as Error, {
        configId: selectedConfigId,
      });
      alert(error instanceof Error ? error.message : 'Failed to update configuration');
    }
  };

  const handleDeleteConfiguration = () => {
    try {
      logger.info('Deleting configuration', { configId: selectedConfigId });
      deleteConfiguration(selectedConfigId);
      setConfigurations(prev => prev.filter(c => c.id !== selectedConfigId));
      setSelectedConfigId('');
      setDeleteDialogOpen(false);
      logger.info('Configuration deleted successfully', { configId: selectedConfigId });
    } catch (error) {
      logger.error('Failed to delete configuration', error as Error, {
        configId: selectedConfigId,
      });
      alert(error instanceof Error ? error.message : 'Failed to delete configuration');
    }
  };

  const handleConfigurationSelect = (id: string) => {
    logger.info('Loading configuration', { configId: id });
    const config = configurations.find(c => c.id === id);
    if (config) {
      setSelectedConfigId(id);
      onConfigurationLoad(config.state);
      logger.info('Configuration loaded successfully', { config });
    } else {
      logger.warn('Configuration not found', { configId: id });
    }
  };

  const selectedConfig = configurations.find(c => c.id === selectedConfigId);

  return (
    <div className="flex gap-2 items-center">
      <Select value={selectedConfigId} onValueChange={handleConfigurationSelect}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select configuration" />
        </SelectTrigger>
        <SelectContent>
          {configurations.map(config => (
            <SelectItem key={config.id} value={config.id}>
              <div className="flex-1">
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-muted-foreground">
                  Updated {format(new Date(config.updatedAt), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedConfigId ? (
        <>
          <Button variant="outline" onClick={handleUpdateConfiguration}>
            Update Current
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Configuration</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedConfig?.name}"? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfiguration}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save As...
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Configuration</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Configuration name"
                value={newConfigName}
                onChange={e => setNewConfigName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveNewConfiguration} disabled={!newConfigName.trim()}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
