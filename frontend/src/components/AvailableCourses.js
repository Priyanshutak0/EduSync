import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { authService } from '../services/authService';
import './Dashboard.css';

const AvailableCourses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAvailableCourses();
    }, []);

    const fetchAvailableCourses = async () => {
        try {
            setError('');
            const data = await courseService.getAvailableCourses();
            setCourses(data);
        } catch (err) {
            setError(err.message || 'Failed to load available courses');
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await courseService.enrollInCourse(courseId);
            navigate('/student-dashboard');
        } catch (err) {
            setError('Failed to enroll in course');
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Available Courses</h1>
                <button onClick={() => navigate('/student-dashboard')} className="back-button">
                    Back to Dashboard
                </button>
            </header>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchAvailableCourses} className="retry-button">
                        Retry
                    </button>
                </div>
            )}

            <main className="dashboard-content">
                <section className="courses-section">
                    <div className="section-header">
                        <h2>Browse Courses</h2>
                    </div>
                    {courses.length === 0 ? (
                        <div className="empty-state">
                            <p>No courses available at the moment.</p>
                        </div>
                    ) : (
                        <div className="courses-grid">
                            {courses.map(course => (
                                <div key={course.courseId} className="course-card">
                                    <h3>{course.title}</h3>
                                    <p>{course.description}</p>
                                    <div className="course-meta">
                                        <span>Instructor: {course.instructor?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="course-actions">
                                        <button 
                                            onClick={() => handleEnroll(course.courseId)}
                                            className="enroll-button"
                                        >
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AvailableCourses; 