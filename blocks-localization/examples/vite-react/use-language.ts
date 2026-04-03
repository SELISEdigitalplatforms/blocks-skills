/**
 * React Query hooks for fetching language data from the Blocks UILM API.
 *
 * These hooks wrap the language service functions with TanStack Query
 * for automatic caching, loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { getLanguage, getModule, getUilmFile } from './language.service';
import { LanguageResponse, ModuleResponse, UilmFileParams } from './language.types';

/**
 * Hook to fetch translation key-value pairs for a specific language and module.
 */
export const useGetUilmFile = (params: UilmFileParams) => {
  const { language, moduleName } = params;

  return useQuery({
    queryKey: ['getUilmFile', language, moduleName],
    queryFn: () => getUilmFile(params),
  });
};

/**
 * Hook to fetch all available languages.
 * Polls every 30 seconds to detect languages added via the Blocks Portal.
 */
export const useAvailableLanguages = () => {
  return useQuery<LanguageResponse>({
    queryKey: ['getLanguages'],
    queryFn: () => getLanguage(),
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook to fetch all available translation modules.
 */
export const useAvailableModules = () => {
  return useQuery<ModuleResponse>({
    queryKey: ['getModule'],
    queryFn: () => getModule(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
