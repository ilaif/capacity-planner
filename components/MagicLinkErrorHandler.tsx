'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const MagicLinkErrorHandler = () => {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1); // remove '#'
      const params = new URLSearchParams(hash);
      const error = params.get('error');
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');

      if (error && errorCode && errorDescription) {
        toast({
          title: 'Error',
          description: decodeURIComponent(errorDescription) + '. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  return null;
};

export default MagicLinkErrorHandler;
