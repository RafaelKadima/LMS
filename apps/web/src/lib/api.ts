import axios from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export const api = {
  // Catalog
  getCatalog: async (params?: { search?: string; page?: number; perPage?: number }) => {
    const { data } = await apiClient.get('/catalog', { params });
    return data;
  },

  getContinueWatching: async () => {
    const { data } = await apiClient.get('/catalog/continue-watching');
    return data;
  },

  getRequired: async () => {
    const { data } = await apiClient.get('/catalog/required');
    return data;
  },

  // Courses
  getCourse: async (id: string) => {
    const { data } = await apiClient.get(`/courses/${id}`);
    return data;
  },

  // Lessons
  getLesson: async (id: string) => {
    const { data } = await apiClient.get(`/lessons/${id}`);
    return data;
  },

  // Enrollments
  enrollInCourse: async (courseId: string) => {
    const { data } = await apiClient.post(`/enrollments/course/${courseId}`);
    return data;
  },

  // Progress
  sendHeartbeat: async (payload: {
    lessonId: string;
    currentTime: number;
    duration: number;
    playbackRate: number;
    event: 'playing' | 'paused' | 'seeked' | 'ended';
  }) => {
    const { data } = await apiClient.post('/progress/heartbeat', payload);
    return data;
  },

  markComplete: async (payload: {
    lessonId: string;
    finalTime: number;
    totalWatched: number;
  }) => {
    const { data } = await apiClient.post('/progress/complete', payload);
    return data;
  },

  // xAPI
  sendXAPIStatement: async (payload: {
    verb: 'played' | 'paused' | 'seeked' | 'completed';
    lessonId: string;
    lessonTitle: string;
    courseId: string;
    courseTitle: string;
    data: Record<string, number>;
  }) => {
    const { data } = await apiClient.post('/xapi/statements', payload);
    return data;
  },

  // Tracks
  getTracks: async () => {
    const { data } = await apiClient.get('/tracks');
    return data;
  },

  getTrack: async (id: string) => {
    const { data } = await apiClient.get(`/tracks/${id}`);
    return data;
  },

  enrollInTrack: async (trackId: string) => {
    const { data } = await apiClient.post(`/tracks/${trackId}/enroll`);
    return data;
  },

  // Auth
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  getMyBadges: async () => {
    const { data } = await apiClient.get('/auth/me/badges');
    return data;
  },

  // =====================
  // ADMIN APIs
  // =====================

  // Dashboard
  admin: {
    getDashboardStats: async () => {
      const { data } = await apiClient.get('/admin/dashboard/stats');
      return data;
    },

    // Users
    getUsers: async (params?: { page?: number; perPage?: number; search?: string; role?: string; cargo?: string; franchiseId?: string; isActive?: boolean }) => {
      const { data } = await apiClient.get('/admin/users', { params });
      return data;
    },
    getUser: async (id: string) => {
      const { data } = await apiClient.get(`/admin/users/${id}`);
      return data;
    },
    createUser: async (payload: any) => {
      const { data } = await apiClient.post('/admin/users', payload);
      return data;
    },
    updateUser: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/admin/users/${id}`, payload);
      return data;
    },
    deleteUser: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/users/${id}`);
      return data;
    },
    resetPassword: async (id: string, payload?: { newPassword?: string }) => {
      const { data } = await apiClient.post(`/admin/users/${id}/reset-password`, payload || {});
      return data;
    },
    toggleUserActive: async (id: string) => {
      const { data } = await apiClient.post(`/admin/users/${id}/toggle-active`);
      return data;
    },
    getUserStats: async () => {
      const { data } = await apiClient.get('/admin/users/stats');
      return data;
    },

    // Badges
    getBadges: async (params?: { page?: number; perPage?: number; search?: string }) => {
      const { data } = await apiClient.get('/admin/badges', { params });
      return data;
    },
    getBadge: async (id: string) => {
      const { data } = await apiClient.get(`/admin/badges/${id}`);
      return data;
    },
    createBadge: async (payload: any) => {
      const { data } = await apiClient.post('/admin/badges', payload);
      return data;
    },
    updateBadge: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/admin/badges/${id}`, payload);
      return data;
    },
    deleteBadge: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/badges/${id}`);
      return data;
    },
    awardBadge: async (badgeId: string, userId: string) => {
      const { data } = await apiClient.post(`/admin/badges/${badgeId}/award/${userId}`);
      return data;
    },
    revokeBadge: async (badgeId: string, userId: string) => {
      const { data } = await apiClient.delete(`/admin/badges/${badgeId}/award/${userId}`);
      return data;
    },
    getBadgeStats: async () => {
      const { data } = await apiClient.get('/admin/badges/stats');
      return data;
    },

    // Franchises
    getFranchises: async (params?: { page?: number; perPage?: number; search?: string }) => {
      const { data } = await apiClient.get('/admin/franchises', { params });
      return data;
    },
    getFranchise: async (id: string) => {
      const { data } = await apiClient.get(`/admin/franchises/${id}`);
      return data;
    },
    createFranchise: async (payload: any) => {
      const { data } = await apiClient.post('/admin/franchises', payload);
      return data;
    },
    updateFranchise: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/admin/franchises/${id}`, payload);
      return data;
    },
    deleteFranchise: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/franchises/${id}`);
      return data;
    },
    getFranchiseStats: async () => {
      const { data } = await apiClient.get('/admin/franchises/stats');
      return data;
    },

    // Stores
    getStores: async (params?: { page?: number; perPage?: number; search?: string; franchiseId?: string; isActive?: boolean }) => {
      const { data } = await apiClient.get('/admin/stores', { params });
      return data;
    },
    getStore: async (id: string) => {
      const { data } = await apiClient.get(`/admin/stores/${id}`);
      return data;
    },
    createStore: async (payload: any) => {
      const { data } = await apiClient.post('/admin/stores', payload);
      return data;
    },
    updateStore: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/admin/stores/${id}`, payload);
      return data;
    },
    deleteStore: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/stores/${id}`);
      return data;
    },
    getStoreStats: async () => {
      const { data } = await apiClient.get('/admin/stores/stats');
      return data;
    },

    // Courses (admin)
    getCourses: async (params?: { page?: number; perPage?: number; search?: string; status?: string }) => {
      const { data } = await apiClient.get('/courses', { params });
      return data;
    },
    createCourse: async (payload: any) => {
      const { data } = await apiClient.post('/courses', payload);
      return data;
    },
    updateCourse: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/courses/${id}`, payload);
      return data;
    },
    deleteCourse: async (id: string) => {
      const { data } = await apiClient.delete(`/courses/${id}`);
      return data;
    },

    // Modules
    createModule: async (payload: any) => {
      const { data } = await apiClient.post('/modules', payload);
      return data;
    },
    updateModule: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/modules/${id}`, payload);
      return data;
    },
    deleteModule: async (id: string) => {
      const { data } = await apiClient.delete(`/modules/${id}`);
      return data;
    },

    // Lessons
    getLesson: async (id: string) => {
      const { data } = await apiClient.get(`/lessons/${id}`);
      return data;
    },
    createLesson: async (payload: any) => {
      const { data } = await apiClient.post('/lessons', payload);
      return data;
    },
    updateLesson: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/lessons/${id}`, payload);
      return data;
    },
    deleteLesson: async (id: string) => {
      const { data } = await apiClient.delete(`/lessons/${id}`);
      return data;
    },
    uploadLessonContent: async (lessonId: string, file: File, uploadType?: 'content' | 'support') => {
      const formData = new FormData();
      formData.append('file', file);
      const url = uploadType
        ? `/lessons/${lessonId}/upload?uploadType=${uploadType}`
        : `/lessons/${lessonId}/upload`;
      const { data } = await apiClient.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    removeSupportMaterial: async (lessonId: string, url: string) => {
      const { data } = await apiClient.delete(`/lessons/${lessonId}/support-material`, {
        data: { url },
      });
      return data;
    },

    // Video Upload
    getPresignedUrl: async (payload: { lessonId: string; fileName: string; contentType: string; fileSize: number }) => {
      const { data } = await apiClient.post('/admin/upload/video/presign', payload);
      return data;
    },
    completeUpload: async (payload: { lessonId: string; key: string; uploadId: string }) => {
      const { data } = await apiClient.post('/admin/upload/video/complete', payload);
      return data;
    },

    // Enrollments
    getEnrollments: async (params?: { page?: number; perPage?: number; courseId?: string; userId?: string; status?: string }) => {
      const { data } = await apiClient.get('/enrollments', { params });
      return data;
    },
    createEnrollment: async (payload: { userId: string; courseId: string }) => {
      const { data } = await apiClient.post('/enrollments', payload);
      return data;
    },
    deleteEnrollment: async (id: string) => {
      const { data } = await apiClient.delete(`/enrollments/${id}`);
      return data;
    },

    // Tracks
    getTracks: async (params?: { page?: number; perPage?: number; search?: string }) => {
      const { data } = await apiClient.get('/tracks', { params });
      return data;
    },
    getTrack: async (id: string) => {
      const { data } = await apiClient.get(`/tracks/${id}`);
      return data;
    },
    createTrack: async (payload: any) => {
      const { data } = await apiClient.post('/tracks', payload);
      return data;
    },
    updateTrack: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/tracks/${id}`, payload);
      return data;
    },
    deleteTrack: async (id: string) => {
      const { data } = await apiClient.delete(`/tracks/${id}`);
      return data;
    },
    addCourseToTrack: async (trackId: string, courseId: string, order: number) => {
      const { data } = await apiClient.post(`/tracks/${trackId}/courses`, { courseId, order });
      return data;
    },
    removeCourseFromTrack: async (trackId: string, courseId: string) => {
      const { data } = await apiClient.delete(`/tracks/${trackId}/courses/${courseId}`);
      return data;
    },

    // Settings
    getSettings: async () => {
      const { data } = await apiClient.get('/settings');
      return data;
    },
    updateSettings: async (payload: {
      primaryColor?: string;
      secondaryColor?: string;
      loginBgType?: string;
      loginBgColor?: string;
      loginBgMediaUrl?: string;
      logoUrl?: string;
    }) => {
      const { data } = await apiClient.put('/admin/settings', payload);
      return data;
    },
    uploadSettingsMedia: async (file: File, mediaType: 'logo' | 'background') => {
      // Upload direto para servidor local
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);

      const { data } = await apiClient.post('/admin/settings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return data.publicUrl;
    },

    // Reports
    getProgressReport: async (params?: { page?: number; perPage?: number; search?: string; courseId?: string; status?: string; franchiseId?: string }) => {
      const { data } = await apiClient.get('/admin/reports/progress', { params });
      return data;
    },
    getUserDetailedProgress: async (userId: string) => {
      const { data } = await apiClient.get(`/admin/reports/progress/${userId}`);
      return data;
    },
  },

  // =====================
  // Notifications
  // =====================
  notifications: {
    getAll: async (params?: { page?: number; perPage?: number }) => {
      const { data } = await apiClient.get('/notifications', { params });
      return data;
    },
    getUnreadCount: async () => {
      const { data } = await apiClient.get('/notifications/unread-count');
      return data;
    },
    markRead: async (id: string) => {
      const { data } = await apiClient.put(`/notifications/${id}/read`);
      return data;
    },
    markAllRead: async () => {
      const { data } = await apiClient.put('/notifications/read-all');
      return data;
    },
  },

  // =====================
  // Meetings
  // =====================
  meetings: {
    getAll: async (filter?: 'upcoming' | 'past') => {
      const { data } = await apiClient.get('/meetings', { params: filter ? { filter } : {} });
      return data;
    },
    getOne: async (id: string) => {
      const { data } = await apiClient.get(`/meetings/${id}`);
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/meetings', payload);
      return data;
    },
    update: async (id: string, payload: any) => {
      const { data } = await apiClient.put(`/meetings/${id}`, payload);
      return data;
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete(`/meetings/${id}`);
      return data;
    },
    respond: async (id: string, response: 'accepted' | 'declined') => {
      const { data } = await apiClient.post(`/meetings/${id}/respond`, { response });
      return data;
    },
    join: async (id: string) => {
      const { data } = await apiClient.post(`/meetings/${id}/join`);
      return data;
    },
    leave: async (id: string) => {
      const { data } = await apiClient.post(`/meetings/${id}/leave`);
      return data;
    },
    start: async (id: string) => {
      const { data } = await apiClient.post(`/meetings/${id}/start`);
      return data;
    },
    end: async (id: string) => {
      const { data } = await apiClient.post(`/meetings/${id}/end`);
      return data;
    },
    // Admin
    getAllAdmin: async (params?: { page?: number; perPage?: number; search?: string }) => {
      const { data } = await apiClient.get('/meetings/admin', { params });
      return data;
    },
  },

  // =====================
  // Engagement (Face Detection)
  // =====================
  engagement: {
    sendEvent: async (payload: {
      type: string;
      timestamp: string;
      videoTime?: number;
      courseId: string;
      lessonId: string;
      metadata?: Record<string, any>;
    }) => {
      const { data } = await apiClient.post('/engagement/events', payload);
      return data;
    },

    sendBatch: async (events: Array<{
      type: string;
      timestamp: string;
      videoTime?: number;
      courseId: string;
      lessonId: string;
      metadata?: Record<string, any>;
    }>) => {
      const { data } = await apiClient.post('/engagement/events/batch', { events });
      return data;
    },

    getReport: async (userId: string, courseId: string) => {
      const { data } = await apiClient.get(`/engagement/report/${userId}/${courseId}`);
      return data;
    },

    getLessonReport: async (userId: string, lessonId: string) => {
      const { data } = await apiClient.get(`/engagement/report/${userId}/lesson/${lessonId}`);
      return data;
    },
  },

  // =====================
  // WebAuthn / Passkeys
  // =====================
  webauthn: {
    getRegistrationOptions: async () => {
      const { data } = await apiClient.post('/webauthn/register/options');
      return data;
    },
    verifyRegistration: async (response: any, deviceName?: string) => {
      const { data } = await apiClient.post('/webauthn/register/verify', { response, deviceName });
      return data;
    },
    getAuthenticationOptions: async (email?: string) => {
      const { data } = await apiClient.post('/webauthn/authenticate/options', { email });
      return data;
    },
    verifyAuthentication: async (sessionId: string, response: any) => {
      const { data } = await apiClient.post('/webauthn/authenticate/verify', { sessionId, response });
      return data;
    },
    listCredentials: async () => {
      const { data } = await apiClient.get('/webauthn/credentials');
      return data;
    },
    deleteCredential: async (id: string) => {
      const { data } = await apiClient.delete(`/webauthn/credentials/${id}`);
      return data;
    },
    renameCredential: async (id: string, deviceName: string) => {
      const { data } = await apiClient.patch(`/webauthn/credentials/${id}`, { deviceName });
      return data;
    },
  },

  // Settings (público - para página de login)
  getPublicSettings: async () => {
    const { data } = await apiClient.get('/settings');
    return data;
  },

  // =====================
  // Google Drive
  // =====================
  drive: {
    getRootFolders: async () => {
      const { data } = await apiClient.get('/drive/folders');
      return data;
    },

    getFolderContents: async (folderId: string) => {
      const { data } = await apiClient.get(`/drive/folders/${folderId}`);
      return data;
    },

    getFileDetails: async (fileId: string) => {
      const { data } = await apiClient.get(`/drive/files/${fileId}`);
      return data;
    },

    getDownloadUrl: (fileId: string) => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      return `${baseUrl}/drive/files/${fileId}/download`;
    },

    // Download file with authentication
    downloadFile: async (fileId: string, fileName: string) => {
      const response = await apiClient.get(`/drive/files/${fileId}/download`, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },

    // Get stream URL for preview (authenticated via token in URL)
    getStreamUrl: async (fileId: string) => {
      const session = await getSession();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      // We'll use the stream endpoint with token in header via fetch
      return `${baseUrl}/drive/files/${fileId}/stream`;
    },

    // Fetch file as blob for preview (authenticated)
    getFileBlob: async (fileId: string, mimeType?: string): Promise<string> => {
      const response = await apiClient.get(`/drive/files/${fileId}/stream`, {
        responseType: 'blob',
      });
      const contentType = mimeType || response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      return window.URL.createObjectURL(blob);
    },

    getPreviewUrl: async (fileId: string) => {
      const { data } = await apiClient.get(`/drive/files/${fileId}/preview`);
      return data.url;
    },

    search: async (query: string) => {
      const { data } = await apiClient.get('/drive/search', { params: { q: query } });
      return data;
    },

    getBreadcrumb: async (folderId: string) => {
      const { data } = await apiClient.get(`/drive/breadcrumb/${folderId}`);
      return data;
    },

    getStatus: async () => {
      const { data } = await apiClient.get('/drive/status');
      return data;
    },
  },
};
