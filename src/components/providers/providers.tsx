'use client';

import { ApolloWrapper } from './apollo-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloWrapper>
      {children}
      <Toaster />
    </ApolloWrapper>
  );
}
