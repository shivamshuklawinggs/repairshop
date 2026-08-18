import { ComponentType, lazy } from 'react';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Lazy load a component with retry logic for failed dynamic imports
 * This helps handle cases where chunks fail to load due to:
 * - Network issues
 * - Stale cached assets after deployment
 * - CDN/server issues
 */
export function lazyRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): React.LazyExoticComponent<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  return lazy(() => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retryCount: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            console.error(`Failed to load component (attempt ${retryCount + 1}/${maxRetries}):`, error);

            // If this is a chunk load error and we haven't force refreshed yet
            if (
              error?.message?.includes('Failed to fetch dynamically imported module') &&
              !pageHasAlreadyBeenForceRefreshed
            ) {
              console.warn('Chunk load error detected. Refreshing page to get latest assets...');
              window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
              window.location.reload();
              return;
            }

            // Retry logic
            if (retryCount < maxRetries - 1) {
              setTimeout(() => {
                console.log(`Retrying import... (${retryCount + 2}/${maxRetries})`);
                attemptImport(retryCount + 1);
              }, retryDelay * (retryCount + 1)); // Exponential backoff
            } else {
              // All retries exhausted
              console.error('All retry attempts exhausted. Component failed to load.');
              reject(error);
            }
          });
      };

      attemptImport(0);
    });
  });
}

/**
 * Clear the force refresh flag on successful navigation
 * Call this in your main App component or router
 */
export function clearForceRefreshFlag(): void {
  window.sessionStorage.removeItem('page-has-been-force-refreshed');
}
