
import { Competition } from './types';

export const COMPETITIONS: Competition[] = [
  {
    id: 'mcm-2024',
    title: '2024年全国大学生数学建模竞赛',
    description: '旨在提高学生建立数学模型和运用计算机技术解决实际问题的综合能力。',
    fee: 300,
    deadline: '2024-09-15',
    category: '数学建模'
  },
  {
    id: 'math-olympiad-2024',
    title: '第35届全国青少年数学奥林匹克',
    description: '发现和选拔具有数学潜质的青少年，推动基础教育阶段数学学科的发展。',
    fee: 150,
    deadline: '2024-11-20',
    category: '纯数学'
  },
  {
    id: 'data-science-2024',
    title: 'XXXX杯数据科学与建模挑战赛',
    description: '结合现代数据分析与数学理论，解决工业界真实业务场景。',
    fee: 200,
    deadline: '2024-10-10',
    category: '数据科学'
  }
];

export const TEMPLATES = [
  { name: 'Word 论文模板 (标准版)', url: '#', type: 'doc' },
  { name: 'LaTeX 模板包 (2024版)', url: '#', type: 'code' },
  { name: '参考文献格式指南', url: '#', type: 'pdf' },
  { name: '摘要页样表', url: '#', type: 'xls' }
];