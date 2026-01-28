import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import { WelcomeStep } from './WelcomeStep';
import { ProjectStep } from './ProjectStep';
import { SpaceStep } from './SpaceStep';
import { StatusStep } from './StatusStep';
import { CompleteStep } from './CompleteStep';
import './OnboardingView.css';

type Step = 'welcome' | 'projects' | 'spaces' | 'statuses' | 'complete';

const STEPS: Step[] = ['welcome', 'projects', 'spaces', 'statuses', 'complete'];

const STEP_INFO: Record<Step, { title: string; subtitle: string }> = {
  welcome: {
    title: 'Welcome to Orchestral',
    subtitle: 'Let\'s set up your Jira visualization dashboard',
  },
  projects: {
    title: 'Select Projects',
    subtitle: 'Choose which Jira projects to include',
  },
  spaces: {
    title: 'Confluence Spaces',
    subtitle: 'Optionally select Confluence spaces to search',
  },
  statuses: {
    title: 'Workflow Statuses',
    subtitle: 'Review detected workflow statuses',
  },
  complete: {
    title: 'Ready to Go!',
    subtitle: 'Review your configuration and finish setup',
  },
};

interface OnboardingViewProps {
  envProjectKeys?: string[];
}

export function OnboardingView({
  envProjectKeys = [],
}: OnboardingViewProps): JSX.Element {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedProjectKeys, setSelectedProjectKeys] = useState<string[]>([]);
  const [selectedSpaceKeys, setSelectedSpaceKeys] = useState<string[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  const {
    connected,
    projects,
    statuses,
    spaces,
    confluenceAvailable,
    checkConnection,
    fetchProjects,
    fetchStatuses,
    fetchSpaces,
    updateSettings,
    completeOnboarding,
  } = useOnboarding();

  // Initialize from existing settings
  useEffect(() => {
    // Will be populated if resuming partial onboarding
  }, []);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const stepInfo = STEP_INFO[currentStep];

  const handleNext = useCallback(async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      // Save settings when moving forward from projects or spaces step
      if (currentStep === 'projects' || currentStep === 'spaces') {
        await updateSettings({
          selectedProjectKeys,
          selectedSpaceKeys,
        });
      }
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex, currentStep, selectedProjectKeys, selectedSpaceKeys, updateSettings]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    // Skip to complete step
    setCurrentStep('complete');
  }, []);

  const handleFinish = useCallback(async () => {
    setCompleting(true);
    try {
      await updateSettings({
        selectedProjectKeys,
        selectedSpaceKeys,
      });
      await completeOnboarding();
      // Navigate to main app
      navigate('/');
      // Force page reload to reinitialize server with new settings
      window.location.reload();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setCompleting(false);
    }
  }, [selectedProjectKeys, selectedSpaceKeys, updateSettings, completeOnboarding, navigate]);

  const handleFetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      return await fetchProjects();
    } finally {
      setProjectsLoading(false);
    }
  }, [fetchProjects]);

  const handleFetchSpaces = useCallback(async () => {
    setSpacesLoading(true);
    try {
      return await fetchSpaces();
    } finally {
      setSpacesLoading(false);
    }
  }, [fetchSpaces]);

  const handleFetchStatuses = useCallback(async () => {
    setStatusesLoading(true);
    try {
      return await fetchStatuses();
    } finally {
      setStatusesLoading(false);
    }
  }, [fetchStatuses]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return connected === true;
      case 'projects':
        return selectedProjectKeys.length > 0;
      case 'spaces':
        return true; // Spaces are optional
      case 'statuses':
        return true; // Read-only step
      case 'complete':
        return selectedProjectKeys.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="onboarding-view">
      <div className="onboarding-view__container">
        <div className="onboarding-view__progress">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`onboarding-view__progress-step ${
                index === currentStepIndex
                  ? 'onboarding-view__progress-step--active'
                  : index < currentStepIndex
                  ? 'onboarding-view__progress-step--completed'
                  : ''
              }`}
            />
          ))}
        </div>

        <div className="onboarding-view__content">
          <div className="onboarding-view__header">
            <h1 className="onboarding-view__title">{stepInfo.title}</h1>
            <p className="onboarding-view__subtitle">{stepInfo.subtitle}</p>
          </div>

          {currentStep === 'welcome' && (
            <WelcomeStep
              onCheckConnection={checkConnection}
              connected={connected}
            />
          )}

          {currentStep === 'projects' && (
            <ProjectStep
              projects={projects}
              selectedKeys={selectedProjectKeys}
              envSuggestedKeys={envProjectKeys}
              loading={projectsLoading}
              onFetchProjects={handleFetchProjects}
              onSelectionChange={setSelectedProjectKeys}
            />
          )}

          {currentStep === 'spaces' && (
            <SpaceStep
              spaces={spaces}
              selectedKeys={selectedSpaceKeys}
              confluenceAvailable={confluenceAvailable}
              loading={spacesLoading}
              onFetchSpaces={handleFetchSpaces}
              onSelectionChange={setSelectedSpaceKeys}
            />
          )}

          {currentStep === 'statuses' && (
            <StatusStep
              statuses={statuses}
              loading={statusesLoading}
              onFetchStatuses={handleFetchStatuses}
            />
          )}

          {currentStep === 'complete' && (
            <CompleteStep
              selectedProjectKeys={selectedProjectKeys}
              selectedSpaceKeys={selectedSpaceKeys}
            />
          )}
        </div>

        <div className="onboarding-view__nav">
          {currentStepIndex > 0 ? (
            <button
              className="onboarding-view__nav-btn onboarding-view__nav-btn--back"
              onClick={handleBack}
            >
              Back
            </button>
          ) : (
            <button
              className="onboarding-view__nav-btn onboarding-view__nav-btn--skip"
              onClick={handleSkip}
            >
              Skip Setup
            </button>
          )}

          {currentStep === 'complete' ? (
            <button
              className="onboarding-view__nav-btn onboarding-view__nav-btn--finish"
              onClick={handleFinish}
              disabled={!canProceed() || completing}
            >
              {completing ? 'Finishing...' : 'Finish Setup'}
            </button>
          ) : (
            <button
              className="onboarding-view__nav-btn onboarding-view__nav-btn--next"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
