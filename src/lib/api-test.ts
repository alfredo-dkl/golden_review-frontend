/**
 * API Integration Test
 * This file demonstrates how to test the connection between frontend and backend
 */

import { apiClient } from '@/lib/api-client';

export const testApiConnection = async () => {
    try {
        console.log('🔌 Testing API Connection...');

        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await apiClient.get('/health');
        console.log('✅ Health check:', healthResponse);

        // Test 2: Initiate login (should get auth URL)
        console.log('2. Testing login initiation...');
        const loginResponse = await apiClient.initiateLogin();
        console.log('✅ Login initiation:', loginResponse.authUrl);

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
        console.log('🔐 Testing Session Validation...');

        const sessionResponse = await apiClient.validateSession();
        console.log('✅ Session validation:', sessionResponse);

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