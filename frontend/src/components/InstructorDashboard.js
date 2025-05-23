import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const InstructorDashboard = () => {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [studentResults, setStudentResults] = useState([]);
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        mediaUrl: '',
        courseUrl: ''
    });

    useEffect(() => {
        // Log user information when component mounts
        console.log('Current user:', user);
        fetchInstructorCourses();
        fetchStudentResults();
    }, [user]); // Add user as a dependency

    const fetchInstructorCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching instructor courses...');

            const response = await fetch('http://localhost:7197/api/Courses/instructor', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch courses: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched all courses:', data);

            // Handle the response format correctly
            let coursesArray;
            if (Array.isArray(data)) {
                coursesArray = data;
            } else if (data.$values && Array.isArray(data.$values)) {
                coursesArray = data.$values;
            } else if (typeof data === 'object') {
                coursesArray = [data];
            } else {
                coursesArray = [];
            }
            
            console.log('Processed courses array:', coursesArray);
            setCourses(coursesArray);
        } catch (err) {
            console.error('Detailed error:', err);
            setError(err.message || 'Failed to load courses');
            setCourses([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching instructor courses...');
            const coursesResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.COURSES.INSTRUCTOR}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!coursesResponse.ok) {
                throw new Error('Failed to fetch courses');
            }

            const coursesData = await coursesResponse.json();
            console.log('Raw courses data:', coursesData);

            // Handle different response formats
            let coursesArray;
            if (Array.isArray(coursesData)) {
                coursesArray = coursesData;
            } else if (coursesData.$values && Array.isArray(coursesData.$values)) {
                coursesArray = coursesData.$values;
            } else if (typeof coursesData === 'object') {
                coursesArray = [coursesData];
            } else {
                coursesArray = [];
            }
            
            console.log(`Found ${coursesArray.length} courses:`, coursesArray.map(c => c.title));

            // Get all results for each course
            const allResults = [];
            for (const course of coursesArray) {
                if (!course || !course.courseId) {
                    console.warn('Invalid course data:', course);
                    continue;
                }

                try {
                    console.log(`Fetching assessments for course: ${course.title} (ID: ${course.courseId})`);
                    const assessmentsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_COURSE(course.courseId)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });

                    if (!assessmentsResponse.ok) {
                        console.warn(`Failed to fetch assessments for course ${course.title}: ${assessmentsResponse.status}`);
                        continue;
                    }

                    const assessmentsData = await assessmentsResponse.json();
                    console.log('Raw assessments data for course', course.title, ':', assessmentsData);

                    // Handle different response formats
                    let assessments;
                    if (Array.isArray(assessmentsData)) {
                        assessments = assessmentsData;
                    } else if (assessmentsData.$values && Array.isArray(assessmentsData.$values)) {
                        assessments = assessmentsData.$values;
                    } else if (typeof assessmentsData === 'object') {
                        assessments = [assessmentsData];
                    } else {
                        assessments = [];
                    }
                    
                    console.log(`Found ${assessments.length} assessments for course ${course.title}:`, 
                        assessments.map(a => a.title));

                    for (const assessment of assessments) {
                        if (!assessment || !assessment.assessmentId) {
                            console.warn('Invalid assessment data:', assessment);
                            continue;
                        }

                        try {
                            console.log(`Fetching results for assessment: ${assessment.title} (ID: ${assessment.assessmentId})`);
                            const resultsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(assessment.assessmentId)}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });

                            if (resultsResponse.status === 404) {
                                console.log(`No results found for assessment ${assessment.title}`);
                                continue;
                            }

                            if (!resultsResponse.ok) {
                                console.warn(`Failed to fetch results for assessment ${assessment.title}: ${resultsResponse.status}`);
                                continue;
                            }

                            const resultsData = await resultsResponse.json();
                            console.log('Raw results data for assessment', assessment.title, ':', resultsData);

                            // The endpoint returns an array of submissions
                            const results = Array.isArray(resultsData) ? resultsData : [];
                            
                            console.log(`Found ${results.length} results for assessment ${assessment.title}`);

                            const mappedResults = results.map(result => ({
                                ...result,
                                courseTitle: course.title,
                                courseId: course.courseId,
                                assessmentTitle: assessment.title,
                                assessmentId: assessment.assessmentId,
                                maxScore: result.maxScore || assessment.maxScore,
                                percentage: result.percentage || (result.score && result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0)
                            }));

                            allResults.push(...mappedResults);
                        } catch (assessmentErr) {
                            console.error(`Error processing assessment ${assessment.title}:`, assessmentErr);
                            continue;
                        }
                    }
                } catch (courseErr) {
                    console.error(`Error processing course ${course.title}:`, courseErr);
                    continue;
                }
            }

            console.log(`Total results found: ${allResults.length}`);
            // Sort results by attempt date (most recent first)
            allResults.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
            setStudentResults(allResults);
        } catch (err) {
            console.error('Error fetching student results:', err);
            setError(err.message || 'Failed to load student results');
        }
    };

    // Add a function to clear the cache when needed
    const clearResultsCache = () => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('assessment_results_')) {
                localStorage.removeItem(key);
            }
        });
    };

    // Add useEffect to clear cache when component unmounts
    useEffect(() => {
        return () => {
            clearResultsCache();
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCourse(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Get the user ID from localStorage if not available in context
            const storedUser = JSON.parse(localStorage.getItem('user'));
            console.log('Stored user:', storedUser);

            if (!storedUser || !storedUser.userId) {
                throw new Error('User information not found. Please log in again.');
            }

            // Process YouTube URL if present
            let processedCourseUrl = newCourse.courseUrl;
            if (processedCourseUrl) {
                // Handle different YouTube URL formats
                if (processedCourseUrl.includes('youtube.com/watch?v=')) {
                    const videoId = processedCourseUrl.split('v=')[1].split('&')[0];
                    processedCourseUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (processedCourseUrl.includes('youtu.be/')) {
                    const videoId = processedCourseUrl.split('youtu.be/')[1].split('?')[0];
                    processedCourseUrl = `https://www.youtube.com/embed/${videoId}`;
                }
            }

            // Log the form data before submission
            console.log('Form data before submission:', newCourse);

            const courseData = {
                courseId: editingCourse ? editingCourse.courseId : crypto.randomUUID(),
                title: newCourse.title,
                description: newCourse.description,
                instructorId: storedUser.userId,
                mediaUrl: newCourse.mediaUrl || null,
                courseUrl: processedCourseUrl || null
            };

            // Log the final course data being sent
            console.log('Submitting course data:', courseData);

            const url = editingCourse 
                ? `http://localhost:7197/api/Courses/${editingCourse.courseId}`
                : 'http://localhost:7197/api/Courses';

            const response = await fetch(url, {
                method: editingCourse ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (!response.ok) {
                let errorMessage = 'Failed to save course';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                }
                throw new Error(errorMessage);
            }

            // Only try to parse JSON if there's content
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                console.log('Server response:', responseData);
            }

            await fetchInstructorCourses();
            setShowForm(false);
            setNewCourse({
                title: '',
                description: '',
                mediaUrl: '',
                courseUrl: ''
            });
            setEditingCourse(null);
        } catch (err) {
            console.error('Error saving course:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleForm = () => {
        setShowForm(!showForm);
        if (!showForm) {
            setNewCourse({
                title: '',
                description: '',
                mediaUrl: '',
                courseUrl: ''
            });
            setEditingCourse(null);
        }
    };

    const handleDelete = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`http://localhost:7197/api/Courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete course');
            }

            // Remove the course from the local state
            setCourses(courses.filter(course => course.courseId !== courseId));
        } catch (err) {
            console.error('Error deleting course:', err);
            setError('Failed to delete course. Please try again.');
        }
    };

    return (
        <div className="container-fluid mt-4 bg-black text-light">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <h2>Instructor Dashboard</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={toggleForm}
                        >
                            {showForm ? 'Cancel' : 'Add New Course'}
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm bg-black text-light">
                            <div className="card-body">
                                <h4 className="card-title mb-4">
                                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                                </h4>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">Course Title</label>
                                        <input
                                            type="text"
                                            className="form-control bg-dark text-light"
                                            id="title"
                                            name="title"
                                            value={newCourse.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">Description</label>
                                        <textarea
                                            className="form-control bg-dark text-light"
                                            id="description"
                                            name="description"
                                            value={newCourse.description}
                                            onChange={handleInputChange}
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="mediaUrl" className="form-label">Course Image URL</label>
                                        <input
                                            type="url"
                                            className="form-control bg-dark text-light"
                                            id="mediaUrl"
                                            name="mediaUrl"
                                            value={newCourse.mediaUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="courseUrl" className="form-label">Course Video URL (YouTube)</label>
                                        <input
                                            type="url"
                                            className="form-control bg-dark text-light"
                                            id="courseUrl"
                                            name="courseUrl"
                                            value={newCourse.courseUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary"
                                            onClick={toggleForm}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Results Section */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Student Assessment Results</h2>
                    <Link to="/instructor-results" className="btn btn-primary">
                        <i className="bi bi-list-check me-2"></i>
                        View All Results
                    </Link>
                </div>
            </div>

            {/* Course Management Section */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>My Courses</h2>
                    <button 
                        className="btn btn-primary"
                        onClick={toggleForm}
                    >
                        {showForm ? 'Cancel' : 'Create New Course'}
                    </button>
                </div>
                <div className="row">
                    {courses && courses.length > 0 ? (
                        courses.map((course) => (
                            <div key={course.courseId} className="col-12 mb-3">
                                <div className="card bg-dark border-secondary">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-4">
                                                {course.mediaUrl ? (
                                                    <img 
                                                        src={course.mediaUrl} 
                                                        alt={course.title}
                                                        className="img-fluid rounded"
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '150px', 
                                                            objectFit: 'cover' 
                                                        }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/300x150?text=No+Thumbnail';
                                                        }}
                                                    />
                                                ) : (
                                                    <div 
                                                        className="bg-secondary rounded d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '150px' 
                                                        }}
                                                    >
                                                        <span className="text-light">No Thumbnail</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-8">
                                                <h5 className="card-title text-light">{course.title}</h5>
                                                <p className="card-text" style={{ color: '#fff' }}>{course.description}</p>
                                                <div className="d-flex justify-content-end mt-3">
                                                    <Link 
                                                        to={`/create-assessment/${course.courseId}`}
                                                        className="btn btn-sm btn-outline-success me-2"
                                                    >
                                                        Create Assessment
                                                    </Link>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => {
                                                            setEditingCourse(course);
                                                            setNewCourse({
                                                                title: course.title,
                                                                description: course.description,
                                                                mediaUrl: course.mediaUrl || '',
                                                                courseUrl: course.courseUrl || ''
                                                            });
                                                            setShowForm(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this course?')) {
                                                                handleDelete(course.courseId);
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12">
                            <div className="alert alert-info">
                                No courses found. Create your first course to get started!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;