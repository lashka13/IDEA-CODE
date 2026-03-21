const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(payload: { name: string; username: string; email: string; password: string; bio?: string; tech_stack?: string[] }) {
    const data = await this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users/');
  }

  async getTopAuthors(limit = 5) {
    return this.request<any[]>(`/users/top?limit=${limit}`);
  }

  async getUser(userId: string) {
    return this.request<any>(`/users/${userId}`);
  }

  async updateProfile(data: any) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Materials
  async getMaterials(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ items: any[]; total: number; page: number; per_page: number }>(`/materials/?${query}`);
  }

  async getPopularMaterials(limit = 8) {
    return this.request<any[]>(`/materials/popular?limit=${limit}`);
  }

  async getMaterial(id: string) {
    return this.request<any>(`/materials/${id}`);
  }

  async createMaterial(data: any) {
    return this.request<any>('/materials/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async purchaseMaterial(id: string) {
    return this.request<any>(`/materials/${id}/purchase`, { method: 'POST' });
  }

  async isPurchased(id: string) {
    return this.request<{ purchased: boolean }>(`/materials/${id}/is-purchased`);
  }

  // Communities
  async getCommunities() {
    return this.request<any[]>('/communities/');
  }

  async getCommunity(slug: string) {
    return this.request<any>(`/communities/${slug}`);
  }

  async joinCommunity(slug: string) {
    return this.request<any>(`/communities/${slug}/join`, { method: 'POST' });
  }

  async leaveCommunity(slug: string) {
    return this.request<any>(`/communities/${slug}/leave`, { method: 'POST' });
  }

  // Transactions
  async getTransactions() {
    return this.request<any[]>('/transactions/');
  }

  async getBalance() {
    return this.request<{ code_coins: number }>('/transactions/balance');
  }

  // Achievements
  async getAchievements() {
    return this.request<any[]>('/achievements/');
  }

  async getMyAchievements() {
    return this.request<any[]>('/achievements/my');
  }

  async getUserAchievements(userId: string) {
    return this.request<any[]>(`/achievements/user/${userId}`);
  }

  // Comments
  async getComments(materialId: string) {
    return this.request<any[]>(`/materials/${materialId}/comments/`);
  }

  async createComment(materialId: string, data: { text: string; rating: number }) {
    return this.request<any>(`/materials/${materialId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Posts
  async getPosts(communitySlug: string) {
    return this.request<any[]>(`/communities/${communitySlug}/posts/`);
  }

  async createPost(communitySlug: string, data: { title: string; content: string }) {
    return this.request<any>(`/communities/${communitySlug}/posts/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async togglePostLike(communitySlug: string, postId: string) {
    return this.request<{ liked: boolean; likes_count: number }>(`/communities/${communitySlug}/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // Lessons
  async getLessons(materialId: string) {
    return this.request<any[]>(`/materials/${materialId}/lessons/`);
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications/');
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markAllRead() {
    return this.request<any>('/notifications/read-all', { method: 'POST' });
  }

  // Chat
  async getChannels() {
    return this.request<any[]>('/chat/channels');
  }

  async getMessages(channelId: string, limit = 50) {
    return this.request<any[]>(`/chat/channels/${channelId}/messages?limit=${limit}`);
  }

  async sendMessage(channelId: string, data: { text: string; reply_to_id?: string }) {
    return this.request<any>(`/chat/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleReaction(messageId: string, emoji: string) {
    return this.request<any>(`/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  // Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${API_BASE}/upload/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }

  // WebSocket
  createChatWebSocket(channelId: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return new WebSocket(`${protocol}//${host}/api/ws/chat/${channelId}?token=${this.token}`);
  }

  logout() {
    this.setToken(null);
  }
}

export const apiClient = new ApiClient();
