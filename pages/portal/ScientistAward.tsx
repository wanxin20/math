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
const DEADLINE = '2026 年 7 月 13 日';

type Cat = ScientistMaterial['category'];
interface CatDef { key: Cat; label: string; desc: string; }

const AWARD_CATS: CatDef[] = [
  { key: 'form', label: '《青年科学家奖申报表》', desc: '下载下方表格，填写并签字盖章后上传（必传）' },
  { key: 'certificate', label: '证件', desc: '身份证、毕业证、学位证、职称证（可多份）' },
  { key: 'papers', label: '代表性论文', desc: '不超过 5 篇代表性论文全文（可多份）' },
  { key: 'attachment', label: '其他附件', desc: '专利、软著、科研项目、奖励、成果转化/应用证明等（可多份）' },
];
const MEMBER_CATS: CatDef[] = [
  { key: 'memberForm', label: '《会员申请表》', desc: '非学会会员请下载填写后上传' },
];

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition';

const ScientistAward: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!getScientistToken());
  const [tab, setTab] = useState<'award' | 'member'>('award');
  const [materials, setMaterials] = useState<ScientistMaterial[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [willing, setWilling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCat, setUploadingCat] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = '青年科学家奖评选 - 深圳市数学学会';
    return () => { document.title = prev; };
  }, []);

  // 登录后载入已有申报（若有）
  useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      const r = await scientistApi.getMine();
      if (r.success && r.data) {
        const d: any = r.data;
        setMaterials(Array.isArray(d.materials) ? d.materials : []);
        setWilling(!!d.willingSponsorConference);
        setAlreadySubmitted(true);
      }
    })();
  }, [loggedIn]);

  const handleUpload = async (cat: Cat, files: FileList | null) => {
    if (!files || !files.length) return;
    setUploadingCat(cat);
    setMsg(null);
    for (const file of Array.from(files)) {
      const r = await scientistUploadFile(file);
      if (r.success && r.data) {
        setMaterials((m) => [
          ...m,
          { category: cat, fileName: r.data!.originalname || r.data!.filename, fileUrl: r.data!.url, size: r.data!.size, mimetype: r.data!.mimetype },
        ]);
      } else {
        setMsg({ type: 'err', text: `「${file.name}」上传失败：${r.message || ''}` });
      }
    }
    setUploadingCat(null);
  };

  const removeMaterial = (idx: number) => setMaterials((m) => m.filter((_, i) => i !== idx));

  // 点提交 → 先弹"是否愿意赞助协办"确认
  const openConfirm = () => {
    if (!materials.some((m) => m.category === 'form')) {
      setMsg({ type: 'err', text: '请先在「奖项申报」上传填好的《青年科学家奖申报表》。' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setMsg(null);
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    const u: any = getScientistUser() || {};
    setSubmitting(true);
    const payload = {
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      institution: u.institution || '',
      title: u.title || undefined,
      willingSponsorConference: willing,
      materials,
    };
    const r = alreadySubmitted ? await scientistApi.update(payload) : await scientistApi.submit(payload);
    setSubmitting(false);
    setShowConfirm(false);
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
    setMaterials([]);
    setAlreadySubmitted(false);
    setWilling(false);
    setMsg(null);
  };

  const cats = tab === 'award' ? AWARD_CATS : MEMBER_CATS;
  const downloadHref = tab === 'award' ? FORM1 : FORM2;
  const downloadText = tab === 'award' ? '下载《青年科学家奖申报表》（.docx）' : '下载《会员申请表》（.doc）';

  return (
    <PortalLayout>
      {/* 横幅 */}
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-9">
          <div className="text-[13px] text-blue-200 mb-2">
            <Link to="/" className="hover:text-white">首页</Link>
            <span className="mx-1.5 opacity-60">›</span>青年科学家奖评选
          </div>
          <h1 className="text-2xl md:text-[30px] font-bold tracking-wide">
            2026 年度“大湾区”青年科学家奖评选
          </h1>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8">
        {msg && (
          <div className={`mb-5 rounded-lg px-4 py-3 text-sm border ${
            msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>{msg.text}</div>
        )}

        <div className="bg-white border-2 border-blue-200 rounded-2xl p-7 md:p-10 mb-7">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-[#0f2a5c] flex items-center gap-2.5">
              <span className="w-1.5 h-6 rounded bg-blue-700 inline-block" />
              在线申报
            </h2>
            {loggedIn && (
              <button onClick={logout} className="text-sm text-slate-400 hover:text-blue-700">退出登录</button>
            )}
          </div>

          <p className="text-sm text-slate-500 mb-6">
            请于 <strong className="text-red-600">{DEADLINE}</strong> 前完成在线提交。
          </p>

          {/* 申报流程 */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-7">
            {[
              ['1', '注册 / 登录', '用论文评选账号'],
              ['2', '下载并填写表格', '填好后签字盖章'],
              ['3', '上传材料并提交', '确认后完成申报'],
            ].map(([n, t, d]) => (
              <div key={n} className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 text-center">
                <div className="w-9 h-9 md:w-10 md:h-10 mx-auto mb-2.5 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">{n}</div>
                <div className="text-sm md:text-[15px] font-semibold text-slate-800">{t}</div>
                <div className="text-xs text-slate-400 mt-1">{d}</div>
              </div>
            ))}
          </div>

          {!loggedIn ? (
            <AuthPanel onLoggedIn={() => setLoggedIn(true)} />
          ) : (
            <div>
              {alreadySubmitted && (
                <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-700">
                  您已提交申报，可在下方增删材料后重新提交（截止 {DEADLINE}）。
                </div>
              )}

              {/* Tab：奖项申报 / 入会申请 */}
              <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 text-sm w-fit">
                {([['award', '奖项申报'], ['member', '入会申请']] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`px-5 py-1.5 rounded-md font-medium transition ${tab === k ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* 下载该 Tab 对应表格 */}
              <div className="mb-5 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3.5 flex items-center justify-between flex-wrap gap-3">
                <span className="text-[13px] text-slate-500">
                  {tab === 'award' ? '请先下载申报表，填写并签字盖章后在下方上传。' : '非学会会员请下载会员申请表，填写后在下方上传。'}
                </span>
                <a href={downloadHref} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition shrink-0">
                  {downloadText}
                </a>
              </div>

              {/* 上传区（竖向排列） */}
              <div className="space-y-4">
                {cats.map((cat) => {
                  const items = materials.map((m, i) => ({ m, i })).filter((x) => x.m.category === cat.key);
                  return (
                    <div key={cat.key} className="border border-slate-200 rounded-xl p-5">
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

              <button onClick={openConfirm}
                className="mt-7 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-12 py-3.5 text-base font-semibold transition shadow-lg shadow-blue-700/20">
                {alreadySubmitted ? '更新申报' : '提交申报'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 提交确认：是否愿意赞助/协办学术会议 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 md:p-7" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0f2a5c] mb-4">提交确认</h3>
            <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-blue-600" checked={willing} onChange={(e) => setWilling(e.target.checked)} />
              <span>本人愿意赞助、参与、协办深圳市数学学会举办的学术会议。</span>
            </label>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">取消</button>
              <button onClick={doSubmit} disabled={submitting}
                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-lg px-6 py-2 text-sm font-semibold">
                {submitting ? '提交中…' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

/** 登录 / 注册（沿用 paper 论文评选账号体系） */
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
      <p className="mt-3 text-xs text-slate-400">登录后即可下载表格、上传材料并提交申报。</p>
    </div>
  );
};

export default ScientistAward;
