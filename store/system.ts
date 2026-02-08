/**
 * 当前访问的系统标识，用于 API 请求头、localStorage 前缀、主题等。
 * 由路由决定：/paper/* → paper，/reform/* → reform。
 */
export type SystemType = 'paper' | 'reform';

let currentSystem: SystemType = 'paper';

export function getSystem(): SystemType {
  return currentSystem;
}

export function setSystem(system: SystemType): void {
  currentSystem = system;
}

/** 根据 pathname 推断系统 */
export function getSystemFromPath(pathname: string): SystemType | null {
  if (pathname.startsWith('/reform')) return 'reform';
  if (pathname.startsWith('/paper')) return 'paper';
  return null;
}

export const systemConfig: Record<
  SystemType,
  { 
    name: string; 
    nameEn: string; 
    navTitle: string; 
    navTitleEn: string; 
    fontClass: string;
    homeBadge: string;
    homeBadgeEn: string;
    heroTitle: string;
    heroTitleEn: string;
    heroSub: string;
    heroSubEn: string;
    targetAudience: string;
    targetAudienceEn: string;
    resourceCategories: {
      template: string;
      rules: string;
      guide: string;
    };
  }
> = {
  paper: {
    name: '论文评选',
    nameEn: 'Paper Evaluation',
    navTitle: '深圳市数学学会博士/硕士学位论文评选平台',
    navTitleEn: 'Shenzhen Mathematics Doctor/Master Degree Paper Evaluation',
    fontClass: 'font-sans', // 默认
    homeBadge: '论文评选进行中',
    homeBadgeEn: 'Paper Evaluation Open',
    heroTitle: '展现数学思维，分享数学智慧',
    heroTitleEn: 'Enhance Mathematics Art, Share Wisdom',
    heroSub: '欢迎来到深圳数学学会论文评选服务平台。在这里，您可以提交数学论文，参与高水平论文评选。',
    heroSubEn: 'Welcome to Shenzhen Mathematics Paper Evaluation Platform. Submit your papers and participate in high-level evaluation.',
    targetAudience: '数学及相关学科研究人员',
    targetAudienceEn: 'Math Researchers',
    resourceCategories: {
      template: '论文模板',
      rules: '竞赛章程',
      guide: '参考资料',
    },
  },
  reform: {
    name: '教师论文竞赛',
    nameEn: 'Teacher Paper Competition',
    navTitle: '深圳数学学会教师论文竞赛平台',
    navTitleEn: 'Shenzhen Mathematics Teacher Paper Competition Platform',
    fontClass: 'system-font-reform', // 教师论文竞赛系统字体，在 index.css 中定义 .system-font-reform
    homeBadge: '教师论文竞赛进行中',
    homeBadgeEn: 'Teacher Paper Competition Open',
    heroTitle: '展现数学思维，分享教研智慧',
    heroTitleEn: 'Enhance Mathematics Art, Share Teaching Wisdom',
    heroSub: '欢迎来到深圳数学学会教师论文竞赛平台。在这里，您可以提交教学研究成果，参与高水平论文竞赛。',
    heroSubEn: 'Welcome to Shenzhen Mathematics Teacher Paper Competition Platform. Submit your teaching research and participate in high-level competition.',
    targetAudience: '数学教师及教研人员',
    targetAudienceEn: 'Math Teachers & Researchers',
    resourceCategories: {
      template: '论文模板',
      rules: '竞赛章程',
      guide: '指导资料',
    },
  },
};
