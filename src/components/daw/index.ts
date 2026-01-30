/**
 * DAW Components - Feature toolbar and modal system
 */

// Core DAW Components
export { default as FeatureToolbar } from './FeatureToolbar';
export { DAWModals } from './DAWModals';
export { AdvancedToolsMenu } from './AdvancedToolsMenu';
export { DAWHeader } from './DAWHeader';
export { DAWAuthGuard } from './DAWAuthGuard';
export { DAWLoadingGate, DAWLoading, DAWError } from './DAWLoadingStates';

// Extracted Layout Components
export { DAWTransportBar } from './DAWTransportBar';
export { DAWSidebar } from './DAWSidebar';
export { DAWTrackList } from './DAWTrackList';

// Project Management
export { default as CloudProjectManager } from './CloudProjectManager';
export { default as CollaborationTools } from './CollaborationTools';
export { default as AudioToMidiConverter } from './AudioToMidiConverter';
export { default as ProjectVersionHistory } from './ProjectVersionHistory';
export { default as ProjectSharingManager } from './ProjectSharingManager';
export { default as ProjectTemplatesDialog } from './ProjectTemplatesDialog';
export { default as OpenProjectModal } from './OpenProjectModal';
export { default as ProjectSettingsModal } from './ProjectSettingsModal';

// Amapiano-specific Tools
export { AmapianoSwingQuantizer } from './AmapianoSwingQuantizer';
export { AuthenticityMeter } from './AuthenticityMeter';
export { RegionalStyleSelector } from './RegionalStyleSelector';
export { VelocityPatternGenerator } from './VelocityPatternGenerator';
export { LogDrumPitchEnvelopeEditor } from './LogDrumPitchEnvelopeEditor';
export { DAWMasteringPanel } from './DAWMasteringPanel';
