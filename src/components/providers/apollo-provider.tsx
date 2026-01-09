'use client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import { PropsWithChildren } from 'react';
import { UserProvider } from '@/context/user-context';

export function ApolloWrapper({ children }: PropsWithChildren) {
  return (
    <ApolloProvider client={apolloClient}>
      <UserProvider>{children}</UserProvider>
    </ApolloProvider>
  );
}
