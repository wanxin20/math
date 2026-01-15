import React, { useState, useEffect } from 'react';
import { newsApi } from '../services/api';

interface News {
  id: number;
  title: string;
  content: string;
  summary?: string;
  type: 'notice' | 'news' | 'announcement' | 'update';
  priority: 'normal' | 'important' | 'urgent';
  isPublished: boolean;
  publishDate?: string;
  viewCount: number;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminNews: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editingNews, setEditingNews] = useState<Partial<News> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyNews: Partial<News> = {
    title: '',
    content: '',
    summary: '',
    type: 'notice',
    priority: 'normal',
    isPublished: false,
    publishDate: new Date().toISOString().split('T')[0],
  };

  useEffect(() => {
    loadNews();
  }, [page, search]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await newsApi.adminGetList({ page, pageSize: 10, search });
      if (response.success) {
        const data = response.data;
        setNewsList(data.items || data.data || []);
        setTotal(data.total || data.meta?.total || 0);
      }
    } catch (error) {
      console.error('加载新闻列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadNews();
  };

  const handleCreate = () => {
    setEditingNews(emptyNews);
    setIsCreating(true);
  };

  const handleEdit = (news: News) => {
    setEditingNews({
      ...news,
      publishDate: news.publishDate ? new Date(news.publishDate).toISOString().split('T')[0] : undefined,
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingNews) return;

    try {
      let response;
      if (isCreating) {
        response = await newsApi.adminCreate(editingNews);
      } else {
        response = await newsApi.adminUpdate(editingNews.id!, editingNews);
      }

      if (response.success) {
        alert(isCreating ? '创建成功！' : '更新成功！');
        setEditingNews(null);
        loadNews();
      } else {
        alert(`操作失败: ${response.message}`);
      }
    } catch (error) {
      console.error('保存新闻失败', error);
      alert('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条新闻吗？')) return;

    try {
      const response = await newsApi.adminDelete(id);
      if (response.success) {
        alert('删除成功！');
        loadNews();
      } else {
        alert(`删除失败: ${response.message}`);
      }
    } catch (error) {
      console.error('删除新闻失败', error);
      alert('删除失败');
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const response = await newsApi.adminTogglePublish(id);
      if (response.success) {
        alert('状态切换成功！');
        loadNews();
      } else {
        alert(`操作失败: ${response.message}`);
      }
    } catch (error) {
      console.error('切换状态失败', error);
      alert('操作失败');
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      notice: '通知',
      news: '新闻',
      announcement: '公告',
      update: '更新',
    };
    return map[type] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      normal: '普通',
      important: '重要',
      urgent: '紧急',
    };
    return map[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      normal: 'bg-gray-100 text-gray-800',
      important: 'bg-blue-100 text-blue-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return map[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            新闻公告管理
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            管理平台新闻公告信息
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4f46e5',
            color: 'white',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; }}
        >
          <i className="fas fa-plus"></i>
          新建公告
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="搜索新闻标题或内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 32px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
          >
            <i className="fas fa-search" style={{ marginRight: '8px' }}></i>
            搜索
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '16px' }}></i>
            <div>加载中...</div>
          </div>
        ) : newsList.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <div>暂无新闻公告</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>标题</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>类型</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>优先级</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>状态</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>发布日期</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>浏览量</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((news) => (
                <tr key={news.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>{news.id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: '500', maxWidth: '300px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {news.title}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f3f4f6', color: '#374151' }}>
                      {getTypeLabel(news.type)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>
                    <span className={getPriorityColor(news.priority)} style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                      {getPriorityLabel(news.priority)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: news.isPublished ? '#dcfce7' : '#f3f4f6',
                      color: news.isPublished ? '#166534' : '#6b7280',
                    }}>
                      {news.isPublished ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                    {news.publishDate ? new Date(news.publishDate).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                    <i className="fas fa-eye" style={{ marginRight: '6px', color: '#9ca3af' }}></i>
                    {news.viewCount || 0}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleTogglePublish(news.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: news.isPublished ? '#fef3c7' : '#dcfce7',
                          color: news.isPublished ? '#92400e' : '#166534',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                      >
                        {news.isPublished ? '取消发布' : '发布'}
                      </button>
                      <button
                        onClick={() => handleEdit(news)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bfdbfe'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(news.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fecaca'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && total > 10 && (
          <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              共 {total} 条记录，第 {page} / {Math.ceil(total / 10)} 页
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page === 1 ? '#f3f4f6' : 'white',
                  color: page === 1 ? '#9ca3af' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 10)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page >= Math.ceil(total / 10) ? '#f3f4f6' : 'white',
                  color: page >= Math.ceil(total / 10) ? '#9ca3af' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: page >= Math.ceil(total / 10) ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingNews && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
          onClick={() => setEditingNews(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              {isCreating ? '新建公告' : '编辑公告'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 标题 */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  标题 *
                </label>
                <input
                  type="text"
                  value={editingNews.title || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                  placeholder="请输入标题"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* 类型和优先级 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    类型
                  </label>
                  <select
                    value={editingNews.type || 'notice'}
                    onChange={(e) => setEditingNews({ ...editingNews, type: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="notice">通知</option>
                    <option value="news">新闻</option>
                    <option value="announcement">公告</option>
                    <option value="update">更新</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    优先级
                  </label>
                  <select
                    value={editingNews.priority || 'normal'}
                    onChange={(e) => setEditingNews({ ...editingNews, priority: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="normal">普通</option>
                    <option value="important">重要</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>

              {/* 摘要 */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  摘要
                </label>
                <input
                  type="text"
                  value={editingNews.summary || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                  placeholder="请输入摘要（可选）"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* 内容 */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  内容 *
                </label>
                <textarea
                  value={editingNews.content || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                  placeholder="请输入内容"
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* 发布日期和状态 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    发布日期
                  </label>
                  <input
                    type="date"
                    value={editingNews.publishDate || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, publishDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    发布状态
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 0' }}>
                    <input
                      type="checkbox"
                      checked={editingNews.isPublished || false}
                      onChange={(e) => setEditingNews({ ...editingNews, isPublished: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>立即发布</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleSave}
                  disabled={!editingNews.title || !editingNews.content}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: (!editingNews.title || !editingNews.content) ? '#e5e7eb' : '#4f46e5',
                    color: 'white',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (!editingNews.title || !editingNews.content) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (editingNews.title && editingNews.content) {
                      e.currentTarget.style.backgroundColor = '#4338ca';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (editingNews.title && editingNews.content) {
                      e.currentTarget.style.backgroundColor = '#4f46e5';
                    }
                  }}
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingNews(null)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
