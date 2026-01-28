import { useEffect, useState } from 'react';

interface WelcomeStepProps {
  onCheckConnection: () => Promise<boolean>;
  connected: boolean | null;
}

export function WelcomeStep({ onCheckConnection, connected }: WelcomeStepProps): JSX.Element {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (connected === null) {
      setChecking(true);
      onCheckConnection().finally(() => setChecking(false));
    }
  }, [connected, onCheckConnection]);

  const handleRetry = async () => {
    setChecking(true);
    await onCheckConnection();
    setChecking(false);
  };

  return (
    <div className="onboarding-step">
      <div className="onboarding-step__connection">
        {checking && (
          <>
            <div className="onboarding-step__connection-icon onboarding-step__connection-icon--checking">
              ...
            </div>
            <p className="onboarding-step__connection-text">
              Connecting to Jira...
            </p>
          </>
        )}

        {!checking && connected === true && (
          <>
            <div className="onboarding-step__connection-icon onboarding-step__connection-icon--success">
              ✓
            </div>
            <p className="onboarding-step__connection-text">
              Successfully connected to your Atlassian instance!
            </p>
          </>
        )}

        {!checking && connected === false && (
          <>
            <div className="onboarding-step__connection-icon onboarding-step__connection-icon--error">
              !
            </div>
            <p className="onboarding-step__connection-text">
              Could not connect to Jira. Please check your API credentials in the .env file.
            </p>
            <button
              className="onboarding-view__nav-btn onboarding-view__nav-btn--next"
              onClick={handleRetry}
            >
              Retry Connection
            </button>
          </>
        )}
      </div>
    </div>
  );
}
