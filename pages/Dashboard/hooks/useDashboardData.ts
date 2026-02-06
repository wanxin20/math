import { useState } from 'react';
import api from '../../../services/api';

export function useDashboardData() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  const loadMyRegistrations = async () => {
    setLoading(true);
    try {
      const response = await api.registration.getMyRegistrations();
      if (response.success && response.data) {
        setMyRegistrations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    setLoadingResources(true);
    try {
      const response = await api.resource.getList({ page: 1, pageSize: 10 });
      if (response.success && response.data) {
        const resourceData = response.data.items || response.data;
        setResources(Array.isArray(resourceData) ? resourceData : []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    myRegistrations,
    resources,
    loading,
    loadingResources,
    loadMyRegistrations,
    loadResources,
  };
}
