import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  scientistAuth,
  scientistApi,
  getScientistToken,
  getScientistUser,
  clearScientistAuth,
  CAT_LABEL,
  type ScientistMaterial,
} from '../../services/scientistApi';

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none';

const ScientistAdmin: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);
  const [tab, setTab] = useState<'apps' | 'users'>('apps');
  const [detail, setDetail] = useState<any | null>(null);
  const [msg, setMsg] = useState('');

  // 登录表单
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = '青年科学家奖申报管理 - 深圳市数学学会';
    window.scrollTo(0, 0);
    if (getScientistToken()) load();
    else setReady(true);
  }, []);

  const load = async () => {
    const r = await scientistApi.adminList();
    if (r.success) {
      setList(r.data || []);
      setAuthed(true);
      setMsg('');
      // 一并拉取“从申报平台注册”的用户（失败不阻塞申报列表）
      const ru = await scientistApi.adminRegistrants();
      if (ru.success) setRegs(ru.data || []);
    } else if (r.code === 401) {
      setAuthed(false);
    } else {
      setMsg(r.message || '加载失败（需管理员账号）');
      setAuthed(false);
    }
    setReady(true);
  };

  const doLogin = async () => {
    setBusy(true); setMsg('');
    const r = await scientistAuth.login(email, password);
    setBusy(false);
    if (!r.success) { setMsg(r.message || '登录失败'); return; }
    const u = getScientistUser();
    if (u?.role !== 'admin') { setMsg('该账号不是管理员，无法查看申报。'); clearScientistAuth(); return; }
    load();
  };

  const logout = () => { clearScientistAuth(); setAuthed(false); setList([]); };

  const exportExcel = async () => {
    const r = await scientistApi.adminExportExcel();
    if (!r.success) setMsg(r.message || '导出失败');
  };

  return (
    <PortalLayout>
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
          <div className="text-[13px] text-blue-200 mb-2">
            <Link to="/" className="hover:text-white">首页</Link>
            <span className="mx-1.5 opacity-60">›</span>青年科学家奖申报管理
          </div>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-wide">青年科学家奖申报 · 管理</h1>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
        {msg && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">{msg}</div>}
        {!ready ? (
          <div className="text-slate-400 py-20 text-center">加载中…</div>
        ) : !authed ? (
          <div className="max-w-sm bg-white border border-slate-200 rounded-xl p-7">
            <h2 className="text-base font-bold text-[#0f2a5c] mb-4">管理员登录</h2>
            <div className="space-y-3">
              <input className={inputCls} placeholder="管理员邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} placeholder="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={doLogin} disabled={busy} className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-semibold">
                {busy ? '登录中…' : '登录'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab 切换 */}
            <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
              {([['apps', `申报列表 (${list.length})`], ['users', `注册用户 (${regs.length})`]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition ${
                    tab === key ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <span className="text-sm text-slate-500">
                {tab === 'apps' ? (
                  <>共 <b className="text-slate-800">{list.length}</b> 份申报</>
                ) : (
                  <>共 <b className="text-slate-800">{regs.length}</b> 个从申报平台注册的用户，其中 <b className="text-slate-800">{regs.filter((u) => u.hasSubmitted).length}</b> 个已提交申报</>
                )}
              </span>
              <div className="flex gap-2">
                {tab === 'apps' && (
                  <button onClick={exportExcel} className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-semibold">导出 Excel</button>
                )}
                <button onClick={load} className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 text-sm hover:bg-slate-50">刷新</button>
                <button onClick={logout} className="text-slate-400 hover:text-blue-700 text-sm px-2">退出</button>
              </div>
            </div>

            {tab === 'apps' ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 font-semibold">姓名</th>
                      <th className="px-4 py-3 font-semibold">工作单位</th>
                      <th className="px-4 py-3 font-semibold">邮箱</th>
                      <th className="px-4 py-3 font-semibold">手机</th>
                      <th className="px-4 py-3 font-semibold">愿协办</th>
                      <th className="px-4 py-3 font-semibold">材料</th>
                      <th className="px-4 py-3 font-semibold">提交时间</th>
                      <th className="px-4 py-3 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">暂无申报</td></tr>
                    ) : list.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-blue-50/40">
                        <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                        <td className="px-4 py-3 text-slate-600">{a.institution}</td>
                        <td className="px-4 py-3 text-slate-500">{a.email}</td>
                        <td className="px-4 py-3 text-slate-600">{a.phone}</td>
                        <td className="px-4 py-3">{a.willingSponsorConference ? '是' : '否'}</td>
                        <td className="px-4 py-3 text-slate-500">{(a.materials || []).length} 个</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleString('zh-CN', { hour12: false }) : ''}</td>
                        <td className="px-4 py-3"><button onClick={() => setDetail(a)} className="text-blue-700 hover:underline">查看</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 font-semibold">姓名</th>
                      <th className="px-4 py-3 font-semibold">邮箱</th>
                      <th className="px-4 py-3 font-semibold">工作单位</th>
                      <th className="px-4 py-3 font-semibold">职称/职务</th>
                      <th className="px-4 py-3 font-semibold">手机</th>
                      <th className="px-4 py-3 font-semibold">注册时间</th>
                      <th className="px-4 py-3 font-semibold">最后登录</th>
                      <th className="px-4 py-3 font-semibold">申报状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regs.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">暂无注册用户</td></tr>
                    ) : regs.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-blue-50/40">
                        <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                        <td className="px-4 py-3 text-slate-600">{u.institution}</td>
                        <td className="px-4 py-3 text-slate-600">{u.title || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{u.registeredAt ? new Date(u.registeredAt).toLocaleString('zh-CN', { hour12: false }) : ''}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('zh-CN', { hour12: false }) : '—'}</td>
                        <td className="px-4 py-3">
                          {u.hasSubmitted ? (
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-600">已提交</span>
                          ) : (
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">未提交</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 明细 */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0f2a5c]">{detail.name} · 申报明细</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {[
                ['姓名', detail.name],
                ['工作单位', detail.institution], ['职称/职务', detail.title],
                ['手机', detail.phone], ['邮箱', detail.email],
                ['愿赞助/协办会议', detail.willingSponsorConference ? '是' : '否'],
              ].map(([k, v]) => (
                <div key={k as string}><dt className="text-slate-400 text-xs">{k}</dt><dd className="text-slate-800">{(v as string) || '—'}</dd></div>
              ))}
            </dl>
            {detail.notes && <p className="mt-4 text-sm text-slate-600"><span className="text-slate-400">备注：</span>{detail.notes}</p>}
            <h4 className="text-sm font-bold text-[#0f2a5c] mt-6 mb-2">申报材料</h4>
            <ul className="space-y-1.5">
              {(detail.materials as ScientistMaterial[] || []).map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 bg-slate-50 rounded px-3 py-2 text-[13px]">
                  <span className="text-slate-500 shrink-0">[{CAT_LABEL[m.category] || m.category}]</span>
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline truncate flex-1">{m.fileName}</a>
                </li>
              ))}
              {(!detail.materials || detail.materials.length === 0) && <li className="text-slate-400 text-sm">无材料</li>}
            </ul>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default ScientistAdmin;
