import React, { useState, useEffect } from 'react';
import { resourceApi, uploadApi } from '../services/api';
import { API_BASE_URL } from '../constants';
import { useSystem } from '../contexts/SystemContext';
import { systemConfig } from '../store/system';

interface Resource {
  id: number;
  name: string;
  description: string;
  type: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  isPublic: boolean;
  sortOrder: number;
  downloadCount: number;
  createdAt: string;
}

const AdminResources: React.FC = () => {
  const { system } = useSystem();
  const cfg = systemConfig[system];
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 资源类别选项（根据当前系统配置）
  const categoryOptions = [
    cfg.resourceCategories.template,
    cfg.resourceCategories.rules,
    cfg.resourceCategories.guide,
  ];

  const emptyResource: Partial<Resource> = {
    name: '',
    description: '',
    type: 'pdf',
    category: cfg.resourceCategories.template,
    fileUrl: '',
    fileSize: 0,
    isPublic: true,
    sortOrder: 0,
  };

  useEffect(() => {
    loadResources();
  }, [page, search]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await resourceApi.adminGetList({ page, limit: 10, search });
      if (response.success) {
        setResources(response.data.data);
        setTotal(response.data.meta.total);
      }
    } catch (error) {
      console.error('加载资源列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadResources();
  };

  const handleCreate = () => {
    setEditingResource(emptyResource as Resource);
    setIsCreating(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsCreating(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadApi.uploadFile(file);
      if (response.success) {
        // 获取完整的URL（后端返回的URL已经包含/uploads前缀）
        const baseUrl = API_BASE_URL.replace(/\/api\/v1$/, '');
        const fullUrl = `${baseUrl}${response.data.url}`;
        
        setEditingResource({
          ...editingResource!,
          fileUrl: fullUrl,
          fileSize: response.data.size,
        });
        alert('文件上传成功！');
      } else {
        alert(`上传失败: ${response.message}`);
      }
    } catch (error) {
      console.error('文件上传失败', error);
      alert('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingResource) return;

    if (!editingResource.fileUrl) {
      alert('请先上传文件');
      return;
    }

    try {
      let response;
      if (isCreating) {
        response = await resourceApi.adminCreate({
          name: editingResource.name,
          description: editingResource.description,
          type: editingResource.type,
          category: editingResource.category,
          fileUrl: editingResource.fileUrl,
          fileSize: editingResource.fileSize,
          isPublic: editingResource.isPublic,
          sortOrder: editingResource.sortOrder,
        });
      } else {
        response = await resourceApi.adminUpdate(editingResource.id, {
          name: editingResource.name,
          description: editingResource.description,
          type: editingResource.type,
          category: editingResource.category,
          fileUrl: editingResource.fileUrl,
          fileSize: editingResource.fileSize,
          isPublic: editingResource.isPublic,
          sortOrder: editingResource.sortOrder,
        });
      }

      if (response.success) {
        alert(isCreating ? '资源已创建' : '资源已更新');
        setEditingResource(null);
        setIsCreating(false);
        loadResources();
      } else {
        alert(`操作失败: ${response.message}`);
      }
    } catch (error) {
      console.error('保存资源失败', error);
      alert('操作失败');
    }
  };

  const handleDelete = async (resourceId: number) => {
    if (!confirm('确定要删除该资源吗？')) return;

    try {
      const response = await resourceApi.adminDelete(resourceId);
      if (response.success) {
        alert('资源已删除');
        loadResources();
      } else {
        alert(`删除失败: ${response.message}`);
      }
    } catch (error) {
      console.error('删除资源失败', error);
      alert('删除失败');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#111827' }}>资源管理</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>管理和发布平台资源文件</p>
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
          + 新建资源
        </button>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="搜索资源（名称、描述）"
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

      {/* 资源列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <p style={{ fontSize: '16px' }}>加载中...</p>
        </div>
      ) : resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px' }}>暂无资源</p>
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
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>名称</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>类型</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>分类</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>文件大小</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>下载次数</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>公开</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>排序</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource, index) => (
                  <tr 
                    key={resource.id}
                    style={{ 
                      borderBottom: index < resources.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                      {resource.name}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {resource.type}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {resource.category}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {resource.downloadCount}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: resource.isPublic ? '#10b98120' : '#6b728020',
                        color: resource.isPublic ? '#10b981' : '#6b7280',
                      }}>
                        {resource.isPublic ? '公开' : '私有'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {resource.sortOrder}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => handleEdit(resource)}
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
                        onClick={() => handleDelete(resource.id)}
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
      {editingResource && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingResource(null);
              setIsCreating(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div style={{
              padding: '24px 30px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                {isCreating ? '📝 新建资源' : '✏️ 编辑资源'}
              </h2>
            </div>

            {/* 表单内容 */}
            <div style={{ padding: '30px', maxHeight: 'calc(85vh - 160px)', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    资源名称 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingResource.name}
                    onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                    placeholder="请输入资源名称"
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
                    资源描述
                  </label>
                  <textarea
                    value={editingResource.description}
                    onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                    placeholder="请输入资源描述信息"
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
                    文件类型
                  </label>
                  <select
                    value={editingResource.type}
                    onChange={(e) => setEditingResource({ ...editingResource, type: e.target.value })}
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
                    <option value="pdf">PDF</option>
                    <option value="doc">Word文档</option>
                    <option value="xls">Excel表格</option>
                    <option value="ppt">PPT演示</option>
                    <option value="video">视频</option>
                    <option value="other">其他</option>
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
                    资源分类
                  </label>
                  <select
                    value={editingResource.category}
                    onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value })}
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
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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
                    上传文件 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ 
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    transition: 'all 0.3s',
                  }}>
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.gz,.tar,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
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
                      {uploading ? '上传中...' : editingResource.fileUrl ? '重新上传' : '选择文件'}
                    </label>
                    {editingResource.fileUrl && (
                      <div style={{ marginTop: '12px', fontSize: '13px', color: '#059669' }}>
                        ✓ 文件已上传 ({(editingResource.fileSize / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      支持 PDF、Word、Excel、PPT、视频等格式，最大 100MB
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    排序顺序
                  </label>
                  <input
                    type="number"
                    value={editingResource.sortOrder}
                    onChange={(e) => setEditingResource({ ...editingResource, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="数字越小越靠前"
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

                <div></div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  >
                    <input
                      type="checkbox"
                      checked={editingResource.isPublic}
                      onChange={(e) => setEditingResource({ ...editingResource, isPublic: e.target.checked })}
                      style={{ 
                        marginRight: '10px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      公开资源 <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(允许所有用户访问)</span>
                    </span>
                  </label>
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
                  setEditingResource(null);
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
                {isCreating ? '创建资源' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
