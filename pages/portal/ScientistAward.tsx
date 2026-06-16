import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';

const FORM1 = '/forms/深圳市数学学会2026年度大湾区青年科学家奖申报表.docx';
const FORM2 = '/forms/深圳市数学学会会员申请表.doc';
const EMAIL = 'szmath2025@163.com';
const DEADLINE = '2026 年 7 月 13 日';

const NOTICE_HTML = `
<p>为深入贯彻落实粤港澳大湾区国际科技创新中心建设要求，进一步发现、凝聚和支持数学及相关交叉领域优秀青年科技人才，促进基础数学、应用数学、计算数学、统计科学及相关交叉方向的学术交流与协同创新，深圳市数学学会拟组织开展 2026 年度"大湾区"青年科学家奖申报工作。现将有关事项通知如下。</p>
<p class="sec-title">一、申报宗旨</p>
<p>本项目旨在面向全国遴选具有数学背景或从事数学相关研究与应用工作的优秀青年学者，鼓励其在粤港澳大湾区科技创新、产业发展、人才培养和学术交流中发挥积极作用，推动数学与相关学科、产业及社会需求深度融合。</p>
<p class="sec-title">二、申报对象</p>
<p>申报对象重点为粤港澳大湾区，同时面向全国范围内高校、科研院所、企事业单位及其他相关机构中从事数学及相关专业研究、应用或科技创新工作的青年学者。</p>
<p class="sec-title">三、申报条件</p>
<p>申报人应同时具备以下基本条件：</p>
<p>（一）拥护科学精神，遵守学术规范，具有良好的职业道德和学术声誉，无学术不端、科研失信或其他不良记录。</p>
<p>（二）年龄原则上不超过 40 周岁，即 1985 年 1 月 1 日之后出生。</p>
<p>（三）具有数学背景或长期从事数学及相关交叉领域研究、教学、应用转化、技术创新等工作，并已取得较为突出的学术成果、应用成果或社会影响。</p>
<p>（四）具有较好的发展潜力，能够积极参与粤港澳大湾区数学及相关领域学术交流、人才培养、产业合作或公共服务工作。</p>
<p>（五）申报人未获深圳市优秀青年基金项目等市级及以上人才项目。</p>
<p>（六）申报人须参加深圳市数学学会于 2026 年下半年举办的青年学者论坛、学术年会或其他相关会议，并根据学会安排作学术报告、专题交流或参与相关学术活动。</p>
<p class="sec-title">四、申报材料</p>
<p>申报人须提交以下材料：</p>
<p>（一）《深圳市数学学会 2026 年度"大湾区"青年科学家奖申报表》；</p>
<p>（二）申报人身份证、博士毕业证和学位证、职称证书复印件电子版；</p>
<p>（三）附件材料，包括但不限于五篇代表性论文全文、专著封面和关键页、专利、软件著作权、科研项目、奖励、成果转化证明、应用证明，及其他必要附件材料。</p>
<p>以上材料应真实、准确、完整。如发现弄虚作假、学术不端或其他不符合申报要求的情形，学会有权取消其申报、入选或相关资格。</p>
<p class="sec-title">五、申报程序</p>
<p>（一）个人申报。申报人按照通知要求准备申报材料，并在 <strong>${DEADLINE}</strong>前提交（提交方式见下方）。</p>
<p>（二）资格审核。学会秘书处对申报材料的完整性、真实性和基本资格进行初步审核。</p>
<p>（三）专家评审。学会组织相关领域专家进行评审，重点考察申报人的学术贡献、创新能力、发展潜力、学术影响等。</p>
<p>（四）结果公示。拟入选名单将进行公示，公示无异议后正式公布。</p>
<p>（五）交流展示。入选者原则上应参加深圳市数学学会 2026 年下半年举办的青年学者论坛、学术年会或相关会议，并作学术报告或专题交流。</p>
<p class="sec-title">六、有关说明</p>
<p>（一）本次申报坚持公开、公平、公正原则，注重学术质量、创新贡献、发展潜力和社会服务实绩。</p>
<p>（二）申报人应保证材料真实有效，并对申报材料的真实性负责。</p>
<p>（三）入选者应积极参与深圳市数学学会组织的相关学术活动、青年人才交流活动及后续学会工作。</p>
<p>（四）深圳市数学学会欢迎高校、科研院所、企事业单位、社会组织及个人以资助、协办、承办、专家支持、学术报告等多种形式参与学会青年奖申报和相关会议活动。</p>
<p>（五）本通知未尽事宜，由深圳市数学学会负责解释。如需了解更多信息，请联系：王老师，邮箱：<a href="mailto:${EMAIL}">${EMAIL}</a>。</p>
<p style="margin-top:18px">主办：深圳市数学学会&#12288;&#12288;协办：深圳市现代机器学习与应用重点实验室</p>
<p>2026 年 6 月 13 日</p>
`;

/** 2026 大湾区青年科学家奖申报页（轻量：通知 + 下载申报表 + 邮箱提交）。路由: /scientist */
const ScientistAward: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = '2026 大湾区青年科学家奖申报 - 深圳市数学学会';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <PortalLayout>
      {/* 横幅 */}
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-9">
          <div className="text-[13px] text-blue-200 mb-2">
            <Link to="/" className="hover:text-white">首页</Link>
            <span className="mx-1.5 opacity-60">›</span>青年科学家奖申报
          </div>
          <h1 className="text-2xl md:text-[30px] font-bold tracking-wide">
            2026 年度“大湾区”青年科学家奖申报
          </h1>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
        {/* 提交方式（置顶醒目） */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 md:p-7 mb-7">
          <h2 className="text-lg font-bold text-[#0f2a5c] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded bg-blue-700 inline-block" />
            申报方式
          </h2>
          <ol className="space-y-3 text-[15px] text-slate-700 leading-relaxed list-decimal list-inside">
            <li>
              下载并填写
              <a href={FORM1} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline mx-1">《青年科学家奖申报表》</a>
              （非学会会员请一并填写
              <a href={FORM2} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline mx-1">《会员申请表》</a>
              ）。
            </li>
            <li>连同身份证、学位证、职称证及代表性成果等附件材料，整理为电子版。</li>
            <li>
              于 <strong className="text-red-600">{DEADLINE}</strong> 前发送至学会邮箱
              <a href={`mailto:${EMAIL}`} className="text-blue-700 font-semibold hover:underline mx-1">{EMAIL}</a>
              （联系人：王老师）。
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={FORM1}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition"
            >
              下载申报表（.docx）
            </a>
            <a
              href={FORM2}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg px-5 py-2.5 text-sm font-semibold transition"
            >
              下载会员申请表（.doc）
            </a>
          </div>
        </div>

        {/* 通知全文 */}
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 md:px-12 md:py-10">
          <h2 className="text-xl md:text-[24px] font-extrabold text-slate-800 text-center leading-relaxed mb-7 pb-5 border-b border-slate-100">
            深圳市数学学会关于开展 2026 年度<br className="md:hidden" />“大湾区”青年科学家奖评选活动的通知
          </h2>
          <div className="portal-art-body" dangerouslySetInnerHTML={{ __html: NOTICE_HTML }} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ScientistAward;
