import { useEffect } from 'react';

type UseKeyboardShortcutsProps = {
  onConfigurationSheetToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

export const useKeyboardShortcuts = ({
  onConfigurationSheetToggle,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          onConfigurationSheetToggle();
        } else if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
          if (event.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
          event.preventDefault();
        } else if (
          (event.metaKey || event.ctrlKey) &&
          (event.key === 'y' || (event.shiftKey && event.key === 'z'))
        ) {
          onRedo();
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onConfigurationSheetToggle, onUndo, onRedo]);
};
