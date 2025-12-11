/**
 * API Integration Test
 * This file demonstrates how to test the connection between frontend and backend
 */

import { apiClient } from '@/lib/api-client';

export const testApiConnection = async () => {
    try {
        const healthResponse = await apiClient.get('/health');
        const loginResponse = await apiClient.initiateLogin();

        return {
            success: true,
            healthStatus: healthResponse,
            authUrl: loginResponse.authUrl,
        };
    } catch (error) {
        console.error('❌ API Connection Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

export const testSessionValidation = async () => {
    try {
        const sessionResponse = await apiClient.validateSession();

        return {
            success: true,
            isValid: sessionResponse.valid,
            user: sessionResponse.user,
        };
    } catch (error) {
        console.error('❌ Session Validation Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};