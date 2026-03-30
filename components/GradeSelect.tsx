import React from 'react';
import { Language } from '../i18n';

export const GRADE_GROUPS = [
  {
    label: { zh: '本科生', en: 'Undergraduate' },
    options: [
      { value: '大一', label: { zh: '大一', en: 'Freshman' } },
      { value: '大二', label: { zh: '大二', en: 'Sophomore' } },
      { value:  '大三', label: { zh: '大三', en: 'Junior' } },
      { value: '大四', label: { zh: '大四', en: 'Senior' } },
      { value: '大五', label: { zh: '大五', en: '5th Year' } },
    ],
  },
  {
    label: { zh: '硕士研究生', en: 'Master' },
    options: [
      { value: '硕士一年级', label: { zh: '硕士一年级', en: 'Master Year 1' } },
      { value: '硕士二年级', label: { zh: '硕士二年级', en: 'Master Year 2' } },
      { value: '硕士三年级', label: { zh: '硕士三年级', en: 'Master Year 3' } },
    ],
  },
  {
    label: { zh: '博士研究生', en: 'Doctoral' },
    options: [
      { value: '博士一年级', label: { zh: '博士一年级', en: 'Doctoral Year 1' } },
      { value: '博士二年级', label: { zh: '博士二年级', en: 'Doctoral Year 2' } },
      { value: '博士三年级', label: { zh: '博士三年级', en: 'Doctoral Year 3' } },
      { value: '博士四年级', label: { zh: '博士四年级', en: 'Doctoral Year 4' } },
      { value: '博士五年级', label: { zh: '博士五年级', en: 'Doctoral Year 5' } },
    ],
  },
] as const;

interface GradeSelectProps {
  value: string;
  onChange: (value: string) => void;
  lang: Language;
  className?: string;
  placeholder?: string;
}

const GradeSelect: React.FC<GradeSelectProps> = ({ value, onChange, lang, className, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={className}
  >
    <option value="">{placeholder || (lang === 'zh' ? '请选择（非学生可不填）' : 'Select (optional for non-students)')}</option>
    {GRADE_GROUPS.map((group) => (
      <optgroup key={group.label.en} label={group.label[lang]}>
        {group.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label[lang]}</option>
        ))}
      </optgroup>
    ))}
  </select>
);

export default GradeSelect;
