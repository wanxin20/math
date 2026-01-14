import React, { useState, useEffect } from 'react';
import { competitionApi, uploadApi } from '../services/api';

interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  fee: number;
  deadline: string;
  startDate: string;
  status: 'draft' | 'open' | 'closed' | 'completed';
  currentParticipants: number;
  coverImageUrl?: string;
  guidelines?: string;
  awardInfo?: string;
  createdAt: string;
}

const AdminCompetitions: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editingCompetition, setEditingCompetition] = useState<Partial<Competition> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const emptyCompetition: Partial<Competition> = {
    title: '',
    description: '',
    category: '基础教育',
    fee: 0,
    deadline: '',
    startDate: '',
    status: 'draft',
    coverImageUrl: '',
    guidelines: '',
    awardInfo: '',
  };

  useEffect(() => {
    loadCompetitions();
  }, [page, search]);

  const loadCompetitions = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 10 };
      // 只在有搜索内容时才添加 search 参数
      if (search && search.trim()) {
        params.search = search;
      }
      
      const response = await competitionApi.adminGetList(params);
      console.log('竞赛列表响应:', response);
      if (response.success) {
        // 后端返回的数据结构：response.data 包含 items 和其他分页信息
        const data = response.data;
        console.log('竞赛数据:', data);
        setCompetitions(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载竞赛列表失败', error);
      alert('加载竞赛列表失败: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCompetitions();
  };

  const handleCreate = () => {
    setEditingCompetition(emptyCompetition);
    setIsCreating(true);
  };

  const handleEdit = (competition: Competition) => {
    // 将日期格式转换为 YYYY-MM-DD 格式
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setEditingCompetition({
      ...competition,
      startDate: formatDate(competition.startDate),
      deadline: formatDate(competition.deadline),
    });
    setIsCreating(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证是否为图片
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadApi.uploadImage(file);
      if (response.success) {
        // 获取完整的URL（后端返回的URL已经包含/uploads前缀）
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/api\/v1$/, '');
        const fullUrl = `${baseUrl}${response.data.url}`;
        
        setEditingCompetition({
          ...editingCompetition!,
          coverImageUrl: fullUrl,
        });
        alert('图片上传成功！');
      } else {
        alert(`上传失败: ${response.message}`);
      }
    } catch (error) {
      console.error('图片上传失败', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingCompetition) return;

    try {
      let response;
      if (isCreating) {
        response = await competitionApi.adminCreate(editingCompetition);
      } else {
        response = await competitionApi.adminUpdate(editingCompetition.id!, editingCompetition);
      }

      if (response.success) {
        alert(isCreating ? '竞赛已创建' : '竞赛已更新');
        setEditingCompetition(null);
        setIsCreating(false);
        loadCompetitions();
      } else {
        alert(`操作失败: ${response.message}`);
      }
    } catch (error) {
      console.error('保存竞赛失败', error);
      alert('操作失败');
    }
  };

  const handleDelete = async (competitionId: string) => {
    if (!confirm('确定要删除该竞赛吗？此操作不可恢复！')) return;

    try {
      const response = await competitionApi.adminDelete(competitionId);
      if (response.success) {
        alert('竞赛已删除');
        loadCompetitions();
      } else {
        alert(`删除失败: ${response.message}`);
      }
    } catch (error) {
      console.error('删除竞赛失败', error);
      alert('删除失败');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      open: '开放报名',
      closed: '已关闭',
      completed: '已完成',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: '#9ca3af',
      open: '#10b981',
      closed: '#ef4444',
      completed: '#6366f1',
    };
    return colorMap[status] || '#6b7280';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#111827' }}>竞赛管理</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>管理和发布竞赛评选活动</p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
        >
          + 新建竞赛
        </button>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="搜索竞赛（标题、描述）"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338ca')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
          >
            搜索
          </button>
        </div>
      </form>

      {/* 竞赛列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <p style={{ fontSize: '16px' }}>加载中...</p>
        </div>
      ) : competitions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px' }}>暂无竞赛</p>
        </div>
      ) : (
        <>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>标题</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>类别</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>费用</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>截止日期</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>参与人数</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>状态</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map((competition, index) => (
                  <tr 
                    key={competition.id}
                    style={{ 
                      borderBottom: index < competitions.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                      {competition.title}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {competition.category}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      ¥{Number(competition.fee).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {competition.deadline ? new Date(competition.deadline).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {competition.currentParticipants}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: `${getStatusColor(competition.status)}20`,
                        color: getStatusColor(competition.status),
                      }}>
                        {getStatusText(competition.status)}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => handleEdit(competition)}
                        style={{
                          marginRight: '8px',
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(competition.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: page === 1 ? '#f3f4f6' : 'white',
                color: page === 1 ? '#9ca3af' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              上一页
            </button>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              第 {page} 页，共 {Math.ceil(total / 10)} 页
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 10)}
              style={{
                padding: '8px 16px',
                backgroundColor: page >= Math.ceil(total / 10) ? '#f3f4f6' : 'white',
                color: page >= Math.ceil(total / 10) ? '#9ca3af' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: page >= Math.ceil(total / 10) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              下一页
            </button>
          </div>
        </>
      )}

      {/* 编辑/创建对话框 */}
      {editingCompetition && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingCompetition(null);
              setIsCreating(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '0',
              borderRadius: '12px',
              minWidth: '700px',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* 标题栏 */}
            <div style={{
              padding: '24px 30px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                {isCreating ? '🏆 新建竞赛' : '✏️ 编辑竞赛'}
              </h2>
            </div>

            {/* 表单内容 */}
            <div style={{ padding: '30px', maxHeight: 'calc(90vh - 160px)', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    竞赛标题 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCompetition.title}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, title: e.target.value })}
                    placeholder="请输入竞赛标题"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    竞赛描述
                  </label>
                  <textarea
                    value={editingCompetition.description}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, description: e.target.value })}
                    placeholder="请输入竞赛描述信息"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      minHeight: '100px',
                      fontSize: '14px',
                      resize: 'vertical',
                      transition: 'all 0.3s',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    竞赛类别 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={editingCompetition.category}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, category: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="基础教育">基础教育</option>
                    <option value="教学创新">教学创新</option>
                    <option value="教育技术">教育技术</option>
                    <option value="课程改革">课程改革</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    评审费用 (元) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={editingCompetition.fee}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    开始日期 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editingCompetition.startDate}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, startDate: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    截止日期 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editingCompetition.deadline}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, deadline: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    竞赛状态 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={editingCompetition.status}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, status: e.target.value as any })}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="draft">草稿</option>
                    <option value="open">开放报名</option>
                    <option value="closed">已关闭</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    封面图片
                  </label>
                  <div style={{ 
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    transition: 'all 0.3s',
                  }}>
                    {editingCompetition.coverImageUrl && (
                      <div style={{ marginBottom: '16px' }}>
                        <img 
                          src={editingCompetition.coverImageUrl} 
                          alt="封面预览" 
                          style={{ 
                            maxWidth: '300px', 
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                          }} 
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: uploading ? '#9ca3af' : '#4f46e5',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                    >
                      {uploading ? '上传中...' : editingCompetition.coverImageUrl ? '更换图片' : '选择图片'}
                    </label>
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      支持 JPG、PNG、GIF、WebP 格式，最大 10MB
                    </p>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    申报指南/竞赛规则
                  </label>
                  <textarea
                    value={editingCompetition.guidelines || ''}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, guidelines: e.target.value })}
                    placeholder="请输入申报指南或竞赛规则"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      minHeight: '100px',
                      fontSize: '14px',
                      resize: 'vertical',
                      transition: 'all 0.3s',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    奖项设置说明
                  </label>
                  <textarea
                    value={editingCompetition.awardInfo || ''}
                    onChange={(e) => setEditingCompetition({ ...editingCompetition, awardInfo: e.target.value })}
                    placeholder="请输入奖项设置说明"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      minHeight: '100px',
                      fontSize: '14px',
                      resize: 'vertical',
                      transition: 'all 0.3s',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            </div>

            {/* 按钮区域 */}
            <div style={{ 
              padding: '20px 30px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f9fafb',
            }}>
              <button
                onClick={() => {
                  setEditingCompetition(null);
                  setIsCreating(false);
                }}
                style={{ 
                  padding: '12px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{ 
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                {isCreating ? '创建竞赛' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompetitions;
