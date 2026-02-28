import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (except 429)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        // Retry up to 3 times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (but with longer interval)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations less aggressively
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Prefetch common data
export const prefetchCommonData = async () => {
  // Prefetch health check
  await queryClient.prefetchQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/health`);
      return response.json();
    },
  });
}; 