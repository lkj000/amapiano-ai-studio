/**
 * DAWLoadingStates - Loading and error states for DAW
 */

import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface LoadingStateProps {
  message: string;
}

export const DAWLoading: React.FC<LoadingStateProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <LoadingSpinner message={message} />
  </div>
);

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export const DAWError: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <ErrorMessage error={error} onRetry={onRetry} />
  </div>
);

interface DAWLoadingGateProps {
  isLoadingList: boolean;
  isListError: boolean;
  listError: Error | null;
  isCreatingDefault: boolean;
  createDefaultError: Error | null;
  isLoadingProject: boolean;
  isProjectError: boolean;
  projectError: Error | null;
  hasActiveProject: boolean;
  hasProjectData: boolean;
  hasValidTracks: boolean;
  children: React.ReactNode;
}

export const DAWLoadingGate: React.FC<DAWLoadingGateProps> = ({
  isLoadingList,
  isListError,
  listError,
  isCreatingDefault,
  createDefaultError,
  isLoadingProject,
  isProjectError,
  projectError,
  hasActiveProject,
  hasProjectData,
  hasValidTracks,
  children,
}) => {
  if (isLoadingList) {
    return <DAWLoading message="Loading projects..." />;
  }

  if (isListError && listError) {
    return <DAWError error={listError} />;
  }

  if (isCreatingDefault) {
    return <DAWLoading message="Creating your first project..." />;
  }

  if (createDefaultError) {
    return <DAWError error={createDefaultError as Error} />;
  }

  if (!hasActiveProject || isLoadingProject) {
    return <DAWLoading message="Loading project..." />;
  }

  if (isProjectError && projectError) {
    return <DAWError error={projectError} />;
  }

  if (!hasProjectData) {
    return <DAWLoading message="Initializing DAW..." />;
  }

  if (!hasValidTracks) {
    return <DAWLoading message="Loading project data..." />;
  }

  return <>{children}</>;
};

export default DAWLoadingGate;
