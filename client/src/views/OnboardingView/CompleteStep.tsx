interface CompleteStepProps {
  selectedProjectKeys: string[];
  selectedSpaceKeys: string[];
}

export function CompleteStep({
  selectedProjectKeys,
  selectedSpaceKeys,
}: CompleteStepProps): JSX.Element {
  return (
    <div className="onboarding-step">
      <div className="onboarding-step__summary">
        <div className="onboarding-step__summary-section">
          <h3 className="onboarding-step__summary-title">Jira Projects</h3>
          {selectedProjectKeys.length > 0 ? (
            <div className="onboarding-step__summary-items">
              {selectedProjectKeys.map(key => (
                <span key={key} className="onboarding-step__summary-item">
                  {key}
                </span>
              ))}
            </div>
          ) : (
            <p className="onboarding-step__summary-empty">No projects selected</p>
          )}
        </div>

        <div className="onboarding-step__summary-section">
          <h3 className="onboarding-step__summary-title">Confluence Spaces</h3>
          {selectedSpaceKeys.length > 0 ? (
            <div className="onboarding-step__summary-items">
              {selectedSpaceKeys.map(key => (
                <span key={key} className="onboarding-step__summary-item">
                  {key}
                </span>
              ))}
            </div>
          ) : (
            <p className="onboarding-step__summary-empty">No spaces selected</p>
          )}
        </div>
      </div>

      <div className="onboarding-step__info" style={{ marginTop: 'var(--md-sys-spacing-4)' }}>
        <div className="onboarding-step__info-icon">i</div>
        <p className="onboarding-step__info-text">
          You can change these settings later by re-running the onboarding wizard.
        </p>
      </div>
    </div>
  );
}
