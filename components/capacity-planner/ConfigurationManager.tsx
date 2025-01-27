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
import { Save, Trash2, Copy } from 'lucide-react';
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
import { DiffView } from './DiffView';

interface ConfigurationManagerProps {
  currentState: PlannerState;
  onConfigurationLoad: (state: PlannerState) => void;
}

export function ConfigurationManager({
  currentState,
  onConfigurationLoad,
}: ConfigurationManagerProps) {
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string>('');
  const [newConfigName, setNewConfigName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    logger.info('Loading saved configurations');
    setConfigurations(getSavedConfigurations());
  }, []);

  useEffect(() => {
    if (
      currentState.configurationName &&
      configurations.find(c => c.name === currentState.configurationName)
    ) {
      setSelectedConfigName(currentState.configurationName);
    }
  }, [currentState.configurationName, configurations]);

  useEffect(() => {
    if (saveDialogOpen || saveAsDialogOpen) {
      setNewConfigName(currentState.configurationName || '');
    }
  }, [saveDialogOpen, saveAsDialogOpen, currentState.configurationName]);

  useEffect(() => {
    if (!selectedConfigName) {
      setHasUnsavedChanges(false);
      return;
    }

    const savedConfig = configurations.find(c => c.name === selectedConfigName);
    if (!savedConfig) {
      setHasUnsavedChanges(false);
      return;
    }

    // Compare current state with saved state
    const hasChanges =
      JSON.stringify(savedConfig.state) !==
      JSON.stringify({
        ...currentState,
        configurationName: selectedConfigName,
      });

    setHasUnsavedChanges(hasChanges);
  }, [currentState, selectedConfigName, configurations]);

  const handleSaveNewConfiguration = () => {
    if (!newConfigName) return;
    logger.info(`Saving new configuration: ${newConfigName}`);
    const configToSave = {
      ...currentState,
      configurationName: newConfigName,
    };
    saveConfiguration(newConfigName, configToSave);
    setConfigurations(getSavedConfigurations());
    setNewConfigName('');
    setSaveDialogOpen(false);
    onConfigurationLoad(configToSave);
  };

  const handleUpdateConfiguration = () => {
    if (!selectedConfigName) return;
    setDiffDialogOpen(false);
    logger.info(`Updating configuration: ${selectedConfigName}`);
    const configToSave = {
      ...currentState,
      configurationName: selectedConfigName,
    };
    updateConfiguration(selectedConfigName, configToSave);
    setConfigurations(getSavedConfigurations());
    onConfigurationLoad(configToSave);
  };

  const handleDeleteConfiguration = () => {
    try {
      logger.info('Deleting configuration', { configName: selectedConfigName });
      deleteConfiguration(selectedConfigName);
      setConfigurations(prev => prev.filter(c => c.name !== selectedConfigName));
      setSelectedConfigName('');
      setDeleteDialogOpen(false);
      logger.info('Configuration deleted successfully', { configName: selectedConfigName });
    } catch (error) {
      logger.error('Failed to delete configuration', error as Error, {
        configName: selectedConfigName,
      });
      alert(error instanceof Error ? error.message : 'Failed to delete configuration');
    }
  };

  const handleConfigurationSelect = (name: string) => {
    logger.info(`Loading configuration: ${name}`);
    setSelectedConfigName(name);
    const config = configurations.find(c => c.name === name);
    if (config) {
      onConfigurationLoad({
        ...config.state,
        configurationName: config.name,
      });
    }
  };

  const handleSaveAsCopy = () => {
    if (!newConfigName) return;
    logger.info(`Saving configuration as copy: ${newConfigName}`);
    const configToSave = {
      ...currentState,
      configurationName: newConfigName,
    };
    saveConfiguration(newConfigName, configToSave);
    setConfigurations(getSavedConfigurations());
    setNewConfigName('');
    setSaveAsDialogOpen(false);
    onConfigurationLoad(configToSave);
  };

  const selectedConfig = configurations.find(c => c.name === selectedConfigName);

  return (
    <div className="flex gap-2 items-center">
      <Select value={selectedConfigName} onValueChange={handleConfigurationSelect}>
        <SelectTrigger className="max-w-[200px]">
          <SelectValue placeholder="Select configuration" />
        </SelectTrigger>
        <SelectContent>
          {configurations.map(config => (
            <SelectItem key={config.name} value={config.name}>
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

      {selectedConfigName ? (
        <>
          <div className="relative">
            <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setDiffDialogOpen(true)}
                  disabled={!hasUnsavedChanges}
                >
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Review Changes</DialogTitle>
                  <DialogDescription>
                    Review the changes before saving the configuration
                  </DialogDescription>
                </DialogHeader>
                {selectedConfig && (
                  <DiffView currentState={currentState} savedState={selectedConfig.state} />
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDiffDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateConfiguration}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
            )}
          </div>
          <Dialog open={saveAsDialogOpen} onOpenChange={setSaveAsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Configuration as Copy</DialogTitle>
                <DialogDescription>Enter a name for the new configuration</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Configuration name"
                  value={newConfigName}
                  onChange={e => setNewConfigName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveAsCopy} disabled={!newConfigName.trim()}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
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
              Save New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Configuration</DialogTitle>
              <DialogDescription>Enter a name for your new configuration</DialogDescription>
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
