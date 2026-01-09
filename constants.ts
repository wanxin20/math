
import { Competition } from './types';

export const COMPETITIONS: Competition[] = [
  {
    id: 'pedagogy-2024',
    title: '2024年度全国基础教育教学研究论文大赛',
    description: '旨在挖掘一线教师的教学实践智慧，推动课程改革与教学方法创新。',
    fee: 200,
    deadline: '2024-10-15',
    category: '基础教育'
  },
  {
    id: 'innovation-2024',
    title: '“卓越课堂”教学创新案例评选',
    description: '重点考察课堂教学模式的突破，通过教学录像与设计方案进行综合评定。',
    fee: 150,
    deadline: '2024-11-20',
    category: '教学创新'
  },
  {
    id: 'edtech-2024',
    title: '智慧教育与数字化校园建设专项论文奖',
    description: '探讨AI与大数据技术在现代校园管理与课堂教学中的深度融合应用。',
    fee: 180,
    deadline: '2024-12-05',
    category: '教育技术'
  }
];

export const TEMPLATES = [
  { name: '教研论文标准 Word 模版', url: '#', type: 'doc' },
  { name: '教学设计案例申报表', url: '#', type: 'doc' },
  { name: '参考文献引用规范 (APA/MLA)', url: '#', type: 'pdf' },
  { name: '评审标准评分表(参考)', url: '#', type: 'xls' }
];
