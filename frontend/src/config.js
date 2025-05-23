const config = {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:7197',
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/Auth/login',
            REGISTER: '/api/Auth/register'
        },
        COURSES: {
            BASE: '/api/Courses',
            AVAILABLE: '/api/Courses/available',
            INSTRUCTOR: '/api/Courses/instructor',
            ENROLLED: '/api/Courses/enrolled',
            ENROLL: (courseId) => `/api/Courses/${courseId}/enroll`
        },
        ASSESSMENTS: {
            BASE: '/api/Assessments',
            GET_BY_ID: (id) => `/api/Assessments/${id}`,
            CREATE: '/api/Assessments',
            UPDATE: (id) => `/api/Assessments/${id}`,
            DELETE: (id) => `/api/Assessments/${id}`,
            GET_BY_COURSE: (courseId) => `/api/Assessments/course/${courseId}`
        },
        RESULTS: {
            BASE: '/api/Results',
            GET_BY_ID: (id) => `/api/Results/${id}`,
            SUBMIT: '/api/Results/submit',
            GET_BY_ASSESSMENT: (assessmentId) => `/api/Results/assessment/${assessmentId}/submissions`
        }
    }
};

export default config; 