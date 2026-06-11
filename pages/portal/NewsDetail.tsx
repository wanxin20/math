import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import { PaperclipIcon } from '../../components/portal/PortalIcons';
import {
  portalNewsApi,
  PortalNewsDetail as NewsDetailData,
  PortalApiError,
  formatNewsDate,
} from '../../services/portalApi';

type LoadState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ok'; data: NewsDetailData };

/** 文章详情页。路由: /news/:id —— 支持外部深链直接访问 */
const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const validId = Number.isInteger(numericId) && numericId > 0;

  const [retry, setRetry] = useState(0);
  // 当前请求的唯一标识；结果带着自己的 key，key 不匹配即视为加载中
  const queryKey = `${id}|${retry}`;
  type FetchResult = { key: string } & (
    | { state: 'ok'; data: NewsDetailData }
    | { state: 'notfound' }
    | { state: 'error' }
  );
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!validId) {
      return;
    }
    let cancelled = false;
    portalNewsApi
      .getDetail(numericId)
      .then((data) => {
        if (!cancelled) {
          setResult({ key: queryKey, state: 'ok', data });
        }
      })
      .catch((e) => {
        if (cancelled) {
          return;
        }
        if (e instanceof PortalApiError && e.status === 404) {
          setResult({ key: queryKey, state: 'notfound' });
        } else {
          console.error('加载文章失败', e);
          setResult({ key: queryKey, state: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [numericId, validId, queryKey]);

  const state: LoadState = !validId
    ? { status: 'notfound' }
    : !result || result.key !== queryKey
      ? { status: 'loading' }
      : result.state === 'ok'
        ? { status: 'ok', data: result.data }
        : { status: result.state };

  const articleTitle = state.status === 'ok' ? state.data.title : null;
  useEffect(() => {
    if (!articleTitle) {
      return;
    }
    const prevTitle = document.title;
    document.title = `${articleTitle} - 深圳市数学学会`;
    return () => {
      document.title = prevTitle;
    };
  }, [articleTitle]);

  return (
    <PortalLayout>
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6 text-2xl font-bold tracking-widest">
          新闻中心
        </div>
      </div>
      <div className="bg-[#f3f7fc] border-b border-slate-200/70">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-3 text-[13px] text-slate-500">
          当前位置：<Link to="/" className="text-blue-700 hover:underline">首页</Link>
          <span className="mx-1">›</span>
          <Link to="/news" className="text-blue-700 hover:underline">新闻中心</Link>
          <span className="mx-1">›</span>正文
        </div>
      </div>

      <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 md:px-14 md:py-10">
          {state.status === 'loading' && (
            <div className="py-24 text-center text-slate-400">加载中…</div>
          )}

          {state.status === 'notfound' && (
            <div className="py-24 text-center">
              <div className="text-slate-500 mb-4">文章不存在或已下线</div>
              <Link to="/news" className="text-blue-700 font-semibold hover:underline">
                ‹ 返回新闻列表
              </Link>
            </div>
          )}

          {state.status === 'error' && (
            <div className="py-24 text-center">
              <div className="text-slate-500 mb-4">加载失败，请稍后重试</div>
              <button
                onClick={() => setRetry((r) => r + 1)}
                className="text-blue-700 font-semibold hover:underline"
              >
                重新加载
              </button>
            </div>
          )}

          {state.status === 'ok' && (
            <article>
              <h1 className="text-xl md:text-[25px] font-extrabold text-slate-800 text-center leading-relaxed mb-4">
                {state.data.title}
              </h1>
              <div className="text-center text-[13px] text-slate-400 pb-4 border-b border-slate-100 mb-6">
                <span>发布时间：{formatNewsDate(state.data).full}</span>
                <span className="mx-2.5 text-slate-200">｜</span>
                <span>来源：深圳市数学学会</span>
                <span className="mx-2.5 text-slate-200">｜</span>
                <span>浏览次数：{state.data.viewCount}</span>
              </div>

              <div
                className="portal-art-body"
                dangerouslySetInnerHTML={{ __html: state.data.content }}
              />

              {state.data.attachmentUrl && (
                <div className="flex items-center gap-2.5 bg-[#f8fbff] border border-blue-200 rounded-lg px-4 py-3.5 mt-6 text-sm text-slate-700">
                  <span className="text-blue-700"><PaperclipIcon /></span>
                  附件：
                  <a
                    href={state.data.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    {state.data.attachmentName || '下载附件'}
                  </a>
                </div>
              )}

              <div className="mt-7 pt-4 border-t border-slate-100 text-sm leading-loose text-slate-600">
                <Link to="/news" className="float-right text-blue-700 font-semibold hover:underline">
                  返回列表 ›
                </Link>
                <div>
                  <span className="text-slate-400">上一条：</span>
                  {state.data.prev ? (
                    <Link to={`/news/${state.data.prev.id}`} className="hover:text-blue-700">
                      {state.data.prev.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">（无）</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400">下一条：</span>
                  {state.data.next ? (
                    <Link to={`/news/${state.data.next.id}`} className="hover:text-blue-700">
                      {state.data.next.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">（无）</span>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default NewsDetail;
