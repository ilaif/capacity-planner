import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { DebouncedInput } from '@/components/ui/debounced-input';

interface AuthDialogProps {
  trigger: React.ReactNode;
  mode?: 'save' | 'default';
  defaultOpen?: boolean;
}

export function AuthDialog({ trigger, mode = 'default', defaultOpen = false }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithMagicLink } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await signInWithMagicLink(email);
      toast({
        title: 'Check your email at ' + email,
        description: 'We sent you a magic link to sign in. You can now close this window.',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in with Magic Link</DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Enter your email to receive a magic link and save your configuration to the cloud.'
              : 'Enter your email to receive a magic link to sign in.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <DebouncedInput
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending magic link...' : 'Send magic link'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
