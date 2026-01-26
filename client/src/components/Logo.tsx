import './Logo.css';

interface LogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function Logo({ size = 40, animated = true, className = '' }: LogoProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`logo ${animated ? 'logo--animated' : ''} ${className}`}
      aria-label="Orchestral logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--md-sys-color-primary, #3F51B5)" />
          <stop offset="100%" stopColor="var(--md-sys-color-primary-dark, #283593)" />
        </linearGradient>
        <linearGradient id="logoWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Main circle */}
      <circle cx="24" cy="24" r="22" fill="url(#logoGrad)" className="logo__bg" />

      {/* Conductor's baton */}
      <path
        d="M14 34 L32 12"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="logo__baton"
      />

      {/* Baton tip - gold accent */}
      <circle cx="32" cy="12" r="2" fill="var(--md-sys-color-tertiary, #FFC107)" className="logo__tip" />

      {/* Harmonic waves */}
      <path
        d="M18 20 Q24 17 30 20"
        stroke="url(#logoWaveGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className="logo__wave logo__wave--1"
      />
      <path
        d="M16 26 Q24 22 32 26"
        stroke="url(#logoWaveGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
        className="logo__wave logo__wave--2"
      />
      <path
        d="M14 32 Q24 27 34 32"
        stroke="url(#logoWaveGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        className="logo__wave logo__wave--3"
      />
    </svg>
  );
}
