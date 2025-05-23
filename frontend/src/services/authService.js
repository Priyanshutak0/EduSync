// Use HTTP for local development since we're dealing with self-signed certificates
const API_URL = 'http://localhost:7197/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = error.message || `HTTP error! status: ${response.status}`;
        console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
        });
        throw new Error(errorMessage);
    }
    return response.json();
};

// Helper function to handle fetch errors
const handleFetchError = (error) => {
    console.error('API Error Details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
    });

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error(
            'Unable to connect to the server. Please ensure:\n' +
            '1. The backend server is running\n' +
            '2. You can access http://localhost:7197/api/Users in your browser\n' +
            '3. The server is not blocked by your firewall'
        );
    }
    throw error;
};

// Helper function to check server status
const checkServerStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/Users`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include',
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Server status check failed:', error);
        return false;
    }
};

export const ROLES = {
    STUDENT: 'Student',
    INSTRUCTOR: 'Instructor'
};

const authService = {
    async login(email, password) {
        console.log('Login attempt with:', { 
            email, 
            passwordLength: password ? password.length : 0,
            passwordType: typeof password
        });
        
        // Ensure email is a string and has a value
        const emailStr = String(email || '').trim();
        if (!emailStr) {
            throw new Error('Email is required');
        }

        // Ensure password is a string and has a value
        const passwordStr = String(password || '').trim();
        console.log('Password validation:', {
            originalLength: password ? password.length : 0,
            trimmedLength: passwordStr.length,
            isEmpty: !passwordStr
        });

        if (!passwordStr) {
            throw new Error('Password is required');
        }

        // Generate a name from email if possible
        const name = emailStr.includes('@') ? emailStr.split('@')[0] : emailStr;

        const requestBody = {
            Email: emailStr,
            Password: passwordStr,
            Name: name,
            Role: 'Instructor' // Default to Instructor for now, backend will validate
        };

        console.log('Sending request:', {
            ...requestBody,
            Password: '***' // Mask password in logs
        });

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.token;
    },

    async register(name, email, password,role) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password ,role}),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        return await response.text();
    },

    logout() {
        localStorage.removeItem('token');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    // Add token to request headers
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    async fetchCourses() {
        try {
            const response = await fetch(`${API_URL}/Courses`, {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            }).catch(handleFetchError);
            return handleResponse(response);
        } catch (error) {
            console.error('Fetch courses error:', error);
            throw new Error('Failed to fetch courses. Please try again.');
        }
    },

    setUserSession(user) {
        const userData = {
            id: user.userId,
            name: user.name,
            email: user.email,
            role: user.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    hasRole(role) {
        const user = this.getCurrentUser();
        return user?.role === role;
    },

    isStudent() {
        return this.hasRole(ROLES.STUDENT);
    },

    isInstructor() {
        return this.hasRole(ROLES.INSTRUCTOR);
    }
};

export default authService; 