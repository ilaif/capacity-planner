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
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';

type AuthDialogProps = {
  trigger: React.ReactNode;
  mode?: 'save' | 'default';
  defaultOpen?: boolean;
};

export function AuthDialog({ trigger, mode = 'default', defaultOpen = false }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const { signInWithEmailOTP, verifyOTP } = useAuthStore();
  const { toast } = useToast();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await signInWithEmailOTP(email);
      setShowOtpInput(true);
      toast({
        title: 'Check your email at ' + email,
        description: 'We sent you a code to sign in.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setShowOtpInput(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await verifyOTP(email, otp);
      toast({
        title: 'Success',
        description: 'You have been signed in successfully.',
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowOtpInput(false);
      setOtp('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in with Email</DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Enter your email to receive a code and save your configuration to the cloud.'
              : 'Enter your email to receive a code to sign in.'}
          </DialogDescription>
        </DialogHeader>
        {!showOtpInput ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send code'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter verification code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength={6}
                className="tracking-widest text-center text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Note: If this is your first time signing up, you will receive a confirmation URL via
                email instead. Please click the confirmation link in your email and return to this
                page.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={handleRequestCode}
              disabled={isLoading}
            >
              Resend code
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
