import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  scientistAuth,
  scientistApi,
  scientistUploadFile,
  getScientistToken,
  getScientistUser,
  clearScientistAuth,
  type ScientistMaterial,
} from '../../services/scientistApi';

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
<p>（一）个人申报。申报人按照通知要求准备申报材料，并在 <strong>${DEADLINE}</strong>前提交（可在本页"在线申报"区注册账号后在线填报上传，或发送至学会邮箱）。</p>
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

interface MaterialCat {
  key: ScientistMaterial['category'];
  label: string;
  desc: string;
  memberOnly?: boolean;
}
const MATERIAL_CATS: MaterialCat[] = [
  { key: 'form', label: '申报表', desc: '《青年科学家奖申报表》（必填）' },
  { key: 'certificate', label: '证件', desc: '身份证、毕业证、学位证、职称证（可多份）' },
  { key: 'papers', label: '代表性论文', desc: '不超过 5 篇代表性论文全文（可多份）' },
  { key: 'attachment', label: '其他附件', desc: '专利、软著、科研项目、奖励、成果转化/应用证明等（可多份）' },
  { key: 'memberForm', label: '会员申请表', desc: '非学会会员请填写并上传《会员申请表》', memberOnly: true },
];

type Form = {
  name: string;
  birthDate: string;
  gender: string;
  institution: string;
  title: string;
  phone: string;
  email: string;
  researchField: string;
  isSocietyMember: boolean;
  willingSponsorConference: boolean;
  notes: string;
};
const EMPTY_FORM: Form = {
  name: '', birthDate: '', gender: '', institution: '', title: '', phone: '',
  email: '', researchField: '', isSocietyMember: false, willingSponsorConference: false, notes: '',
};

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition';

const ScientistAward: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!getScientistToken());
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [materials, setMaterials] = useState<ScientistMaterial[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [uploadingCat, setUploadingCat] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = '青年科学家奖评选 - 深圳市数学学会';
    return () => { document.title = prev; };
  }, []);

  // 登录后：有申报记录则载入，否则用账号信息预填
  useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      const r = await scientistApi.getMine();
      if (r.success && r.data) {
        const d: any = r.data;
        setForm({
          name: d.name || '', birthDate: d.birthDate || '', gender: d.gender || '',
          institution: d.institution || '', title: d.title || '', phone: d.phone || '',
          email: d.email || '', researchField: d.researchField || '',
          isSocietyMember: !!d.isSocietyMember, willingSponsorConference: !!d.willingSponsorConference,
          notes: d.notes || '',
        });
        setMaterials(Array.isArray(d.materials) ? d.materials : []);
        setAlreadySubmitted(true);
      } else {
        const u = getScientistUser();
        setForm((f) => ({
          ...f,
          name: u?.name || '', email: u?.email || '',
          institution: u?.institution || '', title: u?.title || '', phone: u?.phone || '',
        }));
      }
    })();
  }, [loggedIn]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (cat: ScientistMaterial['category'], files: FileList | null) => {
    if (!files || !files.length) return;
    setUploadingCat(cat);
    setMsg(null);
    for (const file of Array.from(files)) {
      const r = await scientistUploadFile(file);
      if (r.success && r.data) {
        const item: ScientistMaterial = {
          category: cat,
          fileName: r.data.originalname || r.data.filename,
          fileUrl: r.data.url,
          size: r.data.size,
          mimetype: r.data.mimetype,
        };
        setMaterials((m) => [...m, item]);
      } else {
        setMsg({ type: 'err', text: `「${file.name}」上传失败：${r.message || ''}` });
      }
    }
    setUploadingCat(null);
  };

  const removeMaterial = (idx: number) => setMaterials((m) => m.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.institution.trim() || !form.phone.trim() || !form.email.trim()) {
      setMsg({ type: 'err', text: '请填写姓名、工作单位、手机、邮箱。' });
      return;
    }
    if (!materials.some((m) => m.category === 'form')) {
      setMsg({ type: 'err', text: '请上传《青年科学家奖申报表》。' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const payload = { ...form, materials };
    const r = alreadySubmitted ? await scientistApi.update(payload) : await scientistApi.submit(payload);
    setSubmitting(false);
    if (r.success) {
      setAlreadySubmitted(true);
      setMsg({ type: 'ok', text: alreadySubmitted ? '已更新申报材料。' : '申报提交成功！如需修改可随时回到本页更新。' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setMsg({ type: 'err', text: r.message || '提交失败，请稍后重试。' });
    }
  };

  const logout = () => {
    clearScientistAuth();
    setLoggedIn(false);
    setForm(EMPTY_FORM);
    setMaterials([]);
    setAlreadySubmitted(false);
    setMsg(null);
  };

  const cats = MATERIAL_CATS.filter((c) => !c.memberOnly || !form.isSocietyMember);

  return (
    <PortalLayout>
      {/* 横幅 */}
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-9">
          <div className="text-[13px] text-blue-200 mb-2">
            <Link to="/" className="hover:text-white">首页</Link>
            <span className="mx-1.5 opacity-60">›</span>青年科学家奖评选
          </div>
          <h1 className="text-2xl md:text-[30px] font-bold tracking-wide">
            2026 年度“大湾区”青年科学家奖评选
          </h1>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
        {msg && (
          <div className={`mb-5 rounded-lg px-4 py-3 text-sm border ${
            msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>{msg.text}</div>
        )}

        {/* 在线申报区 */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 md:p-7 mb-7">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-[#0f2a5c] flex items-center gap-2">
              <span className="w-1.5 h-5 rounded bg-blue-700 inline-block" />
              在线申报
            </h2>
            {loggedIn && (
              <button onClick={logout} className="text-[13px] text-slate-400 hover:text-blue-700">退出登录</button>
            )}
          </div>

          {!loggedIn ? (
            <AuthPanel onLoggedIn={() => setLoggedIn(true)} />
          ) : (
            <div>
              {alreadySubmitted && (
                <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-700">
                  您已提交申报，可在下方修改后重新提交（截止 {DEADLINE}）。
                </div>
              )}
              {/* 申报人信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="姓名" required><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                <Field label="出生年月"><input type="month" className={inputCls} value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
                <Field label="性别">
                  <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                    <option value="">请选择</option><option value="男">男</option><option value="女">女</option>
                  </select>
                </Field>
                <Field label="工作单位" required><input className={inputCls} value={form.institution} onChange={(e) => set('institution', e.target.value)} /></Field>
                <Field label="职称/职务"><input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
                <Field label="研究方向"><input className={inputCls} value={form.researchField} onChange={(e) => set('researchField', e.target.value)} /></Field>
                <Field label="手机" required><input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                <Field label="邮箱" required><input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
              </div>

              <label className="flex items-center gap-2.5 mt-4 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={form.isSocietyMember} onChange={(e) => set('isSocietyMember', e.target.checked)} />
                本人已是深圳市数学学会会员（非会员请在下方上传《会员申请表》）
              </label>
              <label className="flex items-start gap-2.5 mt-3 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 mt-0.5 accent-blue-600" checked={form.willingSponsorConference} onChange={(e) => set('willingSponsorConference', e.target.checked)} />
                <span>本人愿意赞助、参与、协办深圳市数学学会举办的学术会议</span>
              </label>

              {/* 材料上传 */}
              <h3 className="text-[15px] font-bold text-[#0f2a5c] mt-7 mb-1">申报材料上传</h3>
              <p className="text-xs text-slate-400 mb-4">单个文件最大 5GB；支持 PDF/Word/图片/压缩包等。</p>
              <div className="space-y-4">
                {cats.map((cat) => {
                  const items = materials.map((m, i) => ({ m, i })).filter((x) => x.m.category === cat.key);
                  return (
                    <div key={cat.key} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div>
                          <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                          <span className="text-xs text-slate-400 ml-2">{cat.desc}</span>
                        </div>
                        <label className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md px-3 py-1.5 text-[13px] font-medium cursor-pointer transition">
                          {uploadingCat === cat.key ? '上传中…' : '＋ 选择文件'}
                          <input type="file" multiple className="hidden" disabled={uploadingCat === cat.key}
                            onChange={(e) => { handleUpload(cat.key, e.target.files); e.target.value = ''; }} />
                        </label>
                      </div>
                      {items.length > 0 && (
                        <ul className="space-y-1.5">
                          {items.map(({ m, i }) => (
                            <li key={i} className="flex items-center justify-between gap-3 bg-slate-50 rounded px-3 py-1.5 text-[13px]">
                              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline truncate">{m.fileName}</a>
                              <button onClick={() => removeMaterial(i)} className="text-slate-400 hover:text-red-500 shrink-0">删除</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              <Field label="备注（选填）" className="mt-4">
                <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>

              <button onClick={handleSubmit} disabled={submitting}
                className="mt-6 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-lg px-8 py-3 text-sm font-semibold transition">
                {submitting ? '提交中…' : alreadySubmitted ? '更新申报' : '提交申报'}
              </button>
            </div>
          )}
        </div>

        {/* 空白表格下载 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-7 mb-7">
          <h2 className="text-base font-bold text-[#0f2a5c] mb-3">空白表格下载</h2>
          <p className="text-sm text-slate-500 mb-4">下载填写后，在上方"在线申报"对应类别上传；也可整理为电子版发送至学会邮箱 <a href={`mailto:${EMAIL}`} className="text-blue-700 hover:underline">{EMAIL}</a>（联系人：王老师）。</p>
          <div className="flex flex-wrap gap-3">
            <a href={FORM1} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition">下载申报表（.docx）</a>
            <a href={FORM2} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg px-5 py-2.5 text-sm font-semibold transition">下载会员申请表（.doc）</a>
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

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({ label, required, className, children }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

/** 登录 / 注册（沿用 contest 账号体系） */
const AuthPanel: React.FC<{ onLoggedIn: () => void }> = ({ onLoggedIn }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [f, setF] = useState({ name: '', email: '', phone: '', institution: '', title: '', password: '', code: '' });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    if (!f.email) { setErr('请先填写邮箱'); return; }
    setErr('');
    const r = await scientistAuth.sendVerificationCode(f.email);
    if (r.success) setCountdown(60);
    else setErr(r.message || '验证码发送失败');
  };

  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const r = await scientistAuth.login(f.email, f.password);
        if (r.success) onLoggedIn();
        else setErr(r.message || '登录失败');
      } else {
        if (!f.name || !f.email || !f.phone || !f.institution || !f.password) { setErr('请完整填写姓名、邮箱、手机、单位、密码'); setBusy(false); return; }
        if (!f.code) { setErr('请填写邮箱验证码'); setBusy(false); return; }
        const v = await scientistAuth.verifyCode(f.email, f.code);
        if (!v.success) { setErr(v.message || '验证码错误'); setBusy(false); return; }
        const reg = await scientistAuth.register({
          name: f.name, email: f.email, password: f.password,
          institution: f.institution, title: f.title || '—', phone: f.phone,
        });
        if (!reg.success) { setErr(reg.message || '注册失败'); setBusy(false); return; }
        const login = await scientistAuth.login(f.email, f.password);
        if (login.success) onLoggedIn();
        else { setErr('注册成功，请用账号登录'); setMode('login'); }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 text-sm w-fit">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setErr(''); }}
            className={`px-5 py-1.5 rounded-md font-medium transition ${mode === m ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>
            {m === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>
      {err && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 text-sm">{err}</div>}
      <div className="space-y-3">
        {mode === 'register' && (
          <>
            <input className={inputCls} placeholder="姓名" value={f.name} onChange={(e) => set('name', e.target.value)} />
            <input className={inputCls} placeholder="工作单位" value={f.institution} onChange={(e) => set('institution', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="职称/职务（选填）" value={f.title} onChange={(e) => set('title', e.target.value)} />
              <input className={inputCls} placeholder="手机" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </>
        )}
        <input className={inputCls} placeholder="邮箱" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
        {mode === 'register' && (
          <div className="flex gap-2">
            <input className={inputCls} placeholder="邮箱验证码" value={f.code} onChange={(e) => set('code', e.target.value)} />
            <button onClick={sendCode} disabled={countdown > 0}
              className="shrink-0 px-4 rounded-lg border border-blue-300 text-blue-700 text-sm font-medium disabled:opacity-50 disabled:text-slate-400 disabled:border-slate-200">
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
        )}
        <input className={inputCls} placeholder="密码" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} />
        <button onClick={submit} disabled={busy}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-semibold transition">
          {busy ? '处理中…' : mode === 'login' ? '登录' : '注册并进入申报'}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">登录后即可填写申报表并上传材料；账号与"数智创新竞赛"系统通用。</p>
    </div>
  );
};

export default ScientistAward;
