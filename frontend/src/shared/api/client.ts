/**
 * API root: relative `/api` (Vite proxy → gateway :8000) or absolute, e.g.
 * `http://localhost:8000/api`. If you pass only `http://localhost:8000`, `/api` is appended.
 */
function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE?.trim();
  if (!raw) return '/api';
  let base = raw.replace(/\/$/, '');
  // Avoid /auth/login → 404: full path must be .../api/auth/login
  if (/^https?:\/\//i.test(base) && !/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return base;
}

const API_BASE = getApiBase();

/** FastAPI returns `detail` as string, object, or array — normalize for UI. */
function formatApiError(url: string, status: number, body: unknown): string {
  const b = body as { detail?: unknown };
  let msg = '';
  if (b?.detail != null) {
    if (typeof b.detail === 'string') {
      msg = b.detail;
    } else if (Array.isArray(b.detail)) {
      msg = b.detail
        .map((e: { msg?: string; loc?: unknown }) => (typeof e === 'object' && e && 'msg' in e ? (e as { msg: string }).msg : JSON.stringify(e)))
        .join('; ');
    } else {
      msg = JSON.stringify(b.detail);
    }
  }
  if (!msg) msg = `HTTP ${status}`;
  if (status === 404) {
    msg += ` [${url}] — Запрос не попал в auth_service. Откройте сайт через шлюз: http://localhost:8000 (docker compose из папки services/). ` +
      'Do not map a single microservice (e.g. search_service) to port 8000; use the nginx gateway.';
  }
  return msg;
}

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

    const url = `${API_BASE}${path}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(formatApiError(url, response.status, errorBody));
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

  async updateProfile(data: { name?: string; bio?: string; avatar_url?: string; tech_stack?: string[]; skills?: Record<string, number> }) {
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

  async getMyPurchases() {
    return this.request<any[]>('/materials/my-purchases');
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

  async createLesson(materialId: string, data: any) {
    return this.request<any>(`/materials/${materialId}/lessons/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'POST' });
  }

  // Chat
  async getChannels() {
    return this.request<any[]>('/chat/channels/');
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

  // Tasks
  async getTasks(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/tasks/?${query}`);
  }

  async getTask(id: string) {
    return this.request<any>(`/tasks/${id}`);
  }

  async checkTaskAnswer(taskId: string, answerId: string) {
    return this.request<{ correct: boolean; correct_option_id: string; explanation: string }>(
      `/tasks/${taskId}/check`,
      { method: 'POST', body: JSON.stringify({ answer_id: answerId }) },
    );
  }

  async runCode(taskId: string, code: string, language: string, testIndex: number) {
    return this.request<{
      stdout: string; stderr: string; exit_code: number;
      expected: string; passed: boolean; compile_error: string;
    }>(
      `/tasks/${taskId}/run`,
      { method: 'POST', body: JSON.stringify({ code, language, test_index: testIndex }) },
    );
  }

  async submitCode(taskId: string, code: string, language: string) {
    return this.request<{
      all_passed: boolean; total: number; passed_count: number;
      results: { test: number; passed: boolean; hidden?: boolean; stdout?: string; expected?: string; stderr?: string }[];
    }>(
      `/tasks/${taskId}/submit`,
      { method: 'POST', body: JSON.stringify({ code, language }) },
    );
  }

  async reviewCode(taskId: string, code: string, language: string) {
    return this.request<{ review: string }>(
      `/tasks/${taskId}/review`,
      { method: 'POST', body: JSON.stringify({ code, language }) },
    );
  }

  async analyzeThinking(taskId: string, data: { code: string; language: string; thinking_log: string; time_spent_seconds: number }) {
    return this.request<{
      analysis: {
        thinking_score: number;
        thinking_level: string;
        summary: string;
        strengths: string[];
        weaknesses: string[];
        patterns: string[];
        recommendations: string[];
        cognitive_metrics: {
          problem_decomposition: number;
          hypothesis_testing: number;
          abstraction_level: number;
          debugging_approach: number;
          time_management: number;
        };
      };
    }>(
      `/tasks/${taskId}/analyze-thinking`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  // GrowGrade
  async getThinkingHistory() {
    return this.request<any[]>('/tasks/growgrade/history');
  }

  async getThinkingSummary() {
    return this.request<{
      total_analyses: number;
      avg_score: number;
      dominant_level: string;
      avg_metrics: Record<string, number>;
      top_strengths: string[];
      top_weaknesses: string[];
      all_patterns: string[];
      ai_summary: string | null;
    }>('/tasks/growgrade/summary');
  }

  async getUserThinkingSummary(userId: string) {
    return this.request<{
      total_analyses: number;
      avg_score: number;
      dominant_level: string;
      avg_metrics: Record<string, number>;
      all_patterns: string[];
    }>(`/tasks/growgrade/user/${userId}/summary`);
  }

  // Challenges
  async getChallenges(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/challenges/?${query}`);
  }

  // Schedule
  async getScheduleEvents(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/schedule/?${query}`);
  }

  // Mentors
  async getMentors() {
    return this.request<any[]>('/mentors/');
  }

  async getMentor(id: string) {
    return this.request<any>(`/mentors/${id}`);
  }

  async bookMentor(mentorId: string, payload: { topic: string; date: string; time: string; comment?: string }) {
    return this.request<any>(`/mentors/${mentorId}/book`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyBookings() {
    return this.request<any[]>('/mentors/bookings/my');
  }

  // Projects
  async getProjects(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/projects/?${query}`);
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  // Roadmap
  async getRoadmapTracks() {
    return this.request<any[]>('/roadmap/');
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

  // Smart Search (microservices search_service)
  async smartSearch(query: string, topK = 10) {
    return this.request<{
      query: string;
      results: Array<{
        chunk_id: string;
        document_id: string;
        document_title: string;
        score: number;
        snippet: string;
        source_type: string;
      }>;
      total: number;
    }>(`/search/?q=${encodeURIComponent(query)}&top_k=${topK}`);
  }

  async askAssistant(data: { query: string; document_ids: string[]; history?: Array<{ role: string; content: string }> }) {
    return this.request<{ answer: string; sources: string[] }>('/search/assistant/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
