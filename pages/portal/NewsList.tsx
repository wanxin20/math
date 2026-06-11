import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  portalNewsApi,
  PortalNewsItem,
  PortalNewsCategory,
  CATEGORY_LABELS,
  formatNewsDate,
} from '../../services/portalApi';

const PAGE_SIZE = 10;
const CATS: PortalNewsCategory[] = ['news', 'notice'];

/** 新闻列表页。路由: /news?cat=news|notice&page=1&q=关键字 */
const NewsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const cat: PortalNewsCategory = searchParams.get('cat') === 'notice' ? 'notice' : 'news';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const q = searchParams.get('q') || '';

  const [retry, setRetry] = useState(0);
  // 当前查询的唯一标识；结果带着自己的 key，key 不匹配即视为加载中
  const queryKey = `${q ? `q:${q}` : `cat:${cat}`}|${page}|${retry}`;
  const [result, setResult] = useState<{
    key: string;
    items: PortalNewsItem[];
    total: number;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    portalNewsApi
      .getList({ cat: q ? undefined : cat, page, pageSize: PAGE_SIZE, q: q || undefined })
      .then((res) => {
        if (!cancelled) {
          setResult({ key: queryKey, items: res.items, total: res.total, error: false });
        }
      })
      .catch((e) => {
        console.error('加载新闻列表失败', e);
        if (!cancelled) {
          setResult({ key: queryKey, items: [], total: 0, error: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cat, page, q, queryKey]);

  const loading = !result || result.key !== queryKey;
  const error = !loading && result.error;
  const items = !loading && !error ? result.items : [];
  const total = !loading && !error ? result.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const switchCat = (next: PortalNewsCategory) => {
    setSearchParams(next === 'news' ? {} : { cat: next });
  };

  const gotoPage = (p: number) => {
    const params: Record<string, string> = {};
    if (cat !== 'news') {
      params.cat = cat;
    }
    if (q) {
      params.q = q;
    }
    if (p > 1) {
      params.page = String(p);
    }
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  return (
    <PortalLayout>
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-8 text-[30px] font-bold tracking-widest">
          新闻中心
        </div>
      </div>
      <div className="bg-[#f3f7fc] border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-3.5 text-sm text-slate-500">
          当前位置：<Link to="/" className="text-blue-700 hover:underline">首页</Link>
          <span className="mx-1">›</span>新闻中心
          <span className="mx-1">›</span>
          {q ? `搜索“${q}”` : CATEGORY_LABELS[cat]}
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
          {/* 栏目侧边栏 */}
          <aside className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white text-[19px] font-bold px-6 py-5 tracking-wider">
              新闻中心
            </div>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => switchCat(c)}
                className={`w-full flex items-center justify-between px-6 py-4 text-left text-[15.5px] border-b border-slate-100 transition ${
                  !q && cat === c
                    ? 'text-blue-700 font-bold bg-blue-50 border-l-4 border-l-blue-700 pl-5'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {CATEGORY_LABELS[c]} <span>›</span>
              </button>
            ))}
          </aside>

          {/* 列表 */}
          <section className="bg-white border border-slate-200 rounded-xl px-5 md:px-7 pb-6">
            {q && (
              <div className="flex items-center justify-between pt-4 text-sm text-slate-500">
                <span>
                  搜索 <b className="text-slate-700">“{q}”</b> 的结果（{total} 条）
                </span>
                <button onClick={() => navigate('/news')} className="text-blue-700 hover:underline">
                  清除搜索
                </button>
              </div>
            )}
            {loading ? (
              <div className="py-20 text-center text-slate-400">加载中…</div>
            ) : error ? (
              <div className="py-20 text-center text-slate-400">
                加载失败{' '}
                <button onClick={() => setRetry((r) => r + 1)} className="text-blue-700 hover:underline">
                  重试
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center text-slate-400">暂无内容</div>
            ) : (
              <ul>
                {items.map((n) => {
                  const d = formatNewsDate(n);
                  return (
                    <li key={n.id} className="border-b border-dashed border-slate-200 last:border-none">
                      <Link to={`/news/${n.id}`} className="flex items-center gap-5 py-5 group">
                        <span className="shrink-0 w-[72px] h-[72px] bg-[#f5f9ff] border border-blue-100 rounded-lg text-center text-blue-700">
                          <span className="block text-[28px] font-extrabold leading-tight mt-2">{d.day}</span>
                          <span className="block text-xs text-blue-400">{d.yearMonth}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[17px] text-slate-800 leading-relaxed group-hover:text-blue-700 transition">
                            {n.title}
                          </span>
                          {n.summary && (
                            <span className="block truncate text-sm text-slate-400 mt-1.5">
                              {n.summary}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-5 text-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => gotoPage(page - 1)}
                  className="border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:border-blue-300"
                >
                  ‹ 上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-slate-400">…</span>}
                      <button
                        onClick={() => gotoPage(p)}
                        className={`border rounded-md px-3 py-1.5 ${
                          p === page
                            ? 'bg-blue-700 border-blue-700 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => gotoPage(page + 1)}
                  className="border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:border-blue-300"
                >
                  下一页 ›
                </button>
                <span className="text-slate-400 ml-1">共 {total} 条</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </PortalLayout>
  );
};

export default NewsList;
