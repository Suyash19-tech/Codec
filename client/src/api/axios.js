import axios from 'axios';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Log the API URL for debugging (only in development)
if (import.meta.env.DEV) {
    console.log('🔗 API Base URL:', API_URL);
}

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request interceptor to attach auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('codec_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log(`📥 ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        // Log error in development
        if (import.meta.env.DEV) {
            console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`, error.message);
        }

        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            localStorage.removeItem('codec_token');
            localStorage.removeItem('codec_user');
            localStorage.removeItem('codec_user_id');
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
