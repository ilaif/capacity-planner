import { useRef } from 'react';
import { TimelineView } from './capacity-planner/TimelineView';
import {
  ConfigurationSheet,
  ConfigurationSheetHandle,
} from './capacity-planner/ConfigurationSheet';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, LogIn, Menu } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePlannerStore } from '@/store/plannerStore';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const CapacityPlanner = () => {
  const { undo, redo, pastStates, futureStates } = usePlannerStore.temporal.getState();
  const canUndo = !!pastStates.length;
  const canRedo = !!futureStates.length;
  const { user, signOut } = useAuthStore();

  const [openConfigurationSheet, setOpenConfigurationSheet] = useState(false);
  const configSheetRef = useRef<ConfigurationSheetHandle>(null);

  useKeyboardShortcuts({
    onConfigurationSheetToggle: () => setOpenConfigurationSheet(prev => !prev),
    onUndo: () => undo(),
    onRedo: () => redo(),
  });

  const handleFeatureClick = (featureName: string) => {
    setOpenConfigurationSheet(true);
    // Use the ref to focus the feature
    setTimeout(() => {
      configSheetRef.current?.focusFeature(featureName);
    }, 100); // Small delay to ensure the sheet is open
  };

  return (
    <div className="inset-0 flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 relative">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-medium">Capacity Planner</h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-2">
                <span>{user.email}</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <AuthDialog
              trigger={
                <Button variant="outline" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Button>
              }
            />
          )}
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => undo()}
                      disabled={!canUndo}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (⌘Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => redo()}
                      disabled={!canRedo}
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (⌘⇧Z / ⌘Y)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setOpenConfigurationSheet(true)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Configuration (⌘K)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <p className="px-4 py-2 text-sm text-muted-foreground border-b">
          A visual planning tool that helps you estimate project timelines by mapping team capacity
          against feature requirements. Adjust team sizes, WIP limits, and feature specifications to
          optimize your delivery schedule.
        </p>

        <TimelineView onFeatureClick={handleFeatureClick} />

        <ConfigurationSheet
          ref={configSheetRef}
          open={openConfigurationSheet}
          onOpenChange={setOpenConfigurationSheet}
        />
      </div>
    </div>
  );
};

export default CapacityPlanner;
