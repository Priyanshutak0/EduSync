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
            '2. You can access http://localhost:7197/api/Courses in your browser\n' +
            '3. The server is not blocked by your firewall'
        );
    }
    throw error;
};

export const courseService = {
    async createCourse(courseData) {
        try {
            console.log('Creating course:', courseData);
            const response = await fetch(`${API_URL}/Courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    courseId: crypto.randomUUID(),
                    title: courseData.title,
                    description: courseData.description,
                    instructorId: courseData.instructorId,
                    mediaUrl: courseData.mediaUrl
                }),
            }).catch(handleFetchError);

            const newCourse = await handleResponse(response);
            console.log('Course created successfully:', newCourse);
            return newCourse;
        } catch (error) {
            console.error('Create course error:', error);
            throw new Error(error.message || 'Failed to create course. Please try again.');
        }
    },

    async getCourses() {
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

    async getCourse(id) {
        try {
            const response = await fetch(`${API_URL}/Courses/${id}`, {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            }).catch(handleFetchError);
            return handleResponse(response);
        } catch (error) {
            console.error('Fetch course error:', error);
            throw new Error('Failed to fetch course details. Please try again.');
        }
    },

    async updateCourse(id, courseData) {
        try {
            const response = await fetch(`${API_URL}/Courses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    courseId: id,
                    ...courseData
                }),
            }).catch(handleFetchError);

            await handleResponse(response);
            return true;
        } catch (error) {
            console.error('Update course error:', error);
            throw new Error(error.message || 'Failed to update course. Please try again.');
        }
    },

    async deleteCourse(id) {
        try {
            const response = await fetch(`${API_URL}/Courses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            }).catch(handleFetchError);

            await handleResponse(response);
            return true;
        } catch (error) {
            console.error('Delete course error:', error);
            throw new Error(error.message || 'Failed to delete course. Please try again.');
        }
    },

    async getAvailableCourses() {
        try {
            console.log('Fetching all courses...');
            const response = await fetch(`${API_URL}/Courses`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', JSON.stringify(data, null, 2));

            if (!response.ok) {
                const errorDetails = {
                    status: response.status,
                    message: data.message || 'Unknown error',
                    error: data.error,
                    innerError: data.innerError,
                    stackTrace: data.stackTrace
                };
                console.error('Error response details:', errorDetails);
                
                // Create a more descriptive error message
                let errorMessage = 'Failed to fetch courses: ';
                if (data.message) errorMessage += data.message;
                if (data.error) errorMessage += ` (${data.error})`;
                if (data.innerError) errorMessage += ` - ${data.innerError}`;
                
                throw new Error(errorMessage);
            }

            if (!Array.isArray(data)) {
                console.error('Unexpected response format:', data);
                throw new Error('Invalid response format from server');
            }

            return data.map(course => {
                console.log('Processing course:', course);
                return {
                    courseId: course.courseId,
                    title: course.title || 'Untitled Course',
                    description: course.description || 'No description available',
                    mediaUrl: course.mediaUrl,
                    instructor: course.instructor ? {
                        userId: course.instructor.userId,
                        name: course.instructor.name || 'Unknown Instructor',
                        email: course.instructor.email
                    } : {
                        userId: null,
                        name: 'No Instructor Assigned',
                        email: 'N/A'
                    }
                };
            });
        } catch (error) {
            console.error('Fetch courses error:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error; // Throw the original error to preserve the stack trace
        }
    },

    async enrollInCourse(courseId) {
        try {
            const response = await fetch(`${API_URL}/Courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            }).catch(handleFetchError);
            return handleResponse(response);
        } catch (error) {
            console.error('Enroll in course error:', error);
            throw new Error('Failed to enroll in course. Please try again.');
        }
    }
}; 