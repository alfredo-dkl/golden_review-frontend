/**
 * API Client for backend communication
 * Uses cookie-based session authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface BackendUser {
    id: string;
    email: string;
    name: string;
    department: string;
    position: string;
}

export interface Policy {
    policy_number: string;
    insured_name: string;
    effective_date: Date;
    exp_date: Date;
    carrier: string;
    premium: number | null;
    csr: string;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Make HTTP request with cookie authentication
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            credentials: 'include', // Always include cookies for session
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                console.error(`❌ API Error: ${data.error || data.message}`);
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`💥 API Request Failed:`, error);
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Authentication Methods
     */

    /**
     * Create session with user data from Microsoft authentication
     */
    async createSession(user: {
        email: string;
        microsoftId: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        position?: string;
        department?: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: BackendUser;
    }> {
        const result = await this.request('/auth/session', {
            method: 'POST',
            body: JSON.stringify({ user }),
        });
        return result;
    }

    /**
     * Validate current session
     */
    async validateSession(): Promise<{
        success: boolean;
        valid: boolean;
        user: BackendUser;
    }> {
        return this.request('/auth/validate');
    }

    /**
     * Get current user information
     */
    async getCurrentUser(): Promise<{ success: boolean; user: BackendUser }> {
        return this.request('/auth/me');
    }

    /**
     * Logout
     */
    async logout(): Promise<{ success: boolean; message: string }> {
        // Session cookie is cleared by backend
        return this.request('/auth/logout', { method: 'POST' });
    }

    /**
     * Policies Methods
     */

    /**
     * Get all policies with pagination and search
     */
    async getPolicies(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        success: boolean;
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        data: Policy[];
    }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        
        const endpoint = `/policies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.request(endpoint);
    }

    /**
     * Generic API methods for other endpoints
     */

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
export default apiClient;