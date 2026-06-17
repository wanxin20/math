import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** ∑ 学会 logo 符号 */
export const SigmaIcon: React.FC<IconProps> = ({ size = 26, className, strokeWidth = 2.4 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M18 5.5V4H6l7 8-7 8h12v-1.5" />
  </svg>
);

/** 文档（论文评选） */
export const FileTextIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/** 学位帽（教师论文竞赛） */
export const GraduationCapIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    <path d="M22 10v6" />
  </svg>
);

/** 奖杯（数智创新竞赛） */
export const TrophyIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M6 2h12v7a6 6 0 0 1-12 0V2z" />
    <path d="M12 15v3" />
    <path d="M8 22h8" />
    <path d="M10 22a2 2 0 0 1 2-2 2 2 0 0 1 2 2" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 14, className, strokeWidth = 2.4 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** 奖章（青年科学家奖评选） */
export const MedalIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
    <path d="M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8" />
    <circle cx="12" cy="17" r="5" />
    <path d="M12 18v-2h-.5" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 16, className, strokeWidth = 2.4 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const PaperclipIcon: React.FC<IconProps> = ({ size = 18, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
