import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const InstructorResults = () => {
    const { user } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({
        course: 'all',
        assessment: 'all',
        student: 'all'
    });

    useEffect(() => {
        fetchAllResults();
    }, []);

    const fetchAllResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Get all courses first
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
            const coursesArray = Array.isArray(coursesData) ? coursesData : 
                               (coursesData.$values && Array.isArray(coursesData.$values)) ? coursesData.$values : [];

            // Get all results for each course
            const allResults = [];
            for (const course of coursesArray) {
                try {
                    const assessmentsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_COURSE(course.courseId)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });

                    if (!assessmentsResponse.ok) {
                        console.warn(`Failed to fetch assessments for course ${course.courseId}: ${assessmentsResponse.status}`);
                        continue;
                    }

                    const assessmentsData = await assessmentsResponse.json();
                    const assessments = Array.isArray(assessmentsData) ? assessmentsData : 
                                     (assessmentsData.$values && Array.isArray(assessmentsData.$values)) ? assessmentsData.$values : [];

                    for (const assessment of assessments) {
                        try {
                            const resultsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(assessment.assessmentId)}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });

                            if (resultsResponse.status === 404) {
                                console.log(`No results found for assessment ${assessment.assessmentId}`);
                                continue;
                            }

                            if (!resultsResponse.ok) {
                                console.warn(`Failed to fetch results for assessment ${assessment.assessmentId}: ${resultsResponse.status}`);
                                continue;
                            }

                            const resultsData = await resultsResponse.json();
                            const results = Array.isArray(resultsData) ? resultsData : 
                                         (resultsData.$values && Array.isArray(resultsData.$values)) ? resultsData.$values : [];

                            const mappedResults = results.map(result => ({
                                ...result,
                                courseTitle: course.title,
                                courseId: course.courseId,
                                assessmentTitle: assessment.title,
                                assessmentId: assessment.assessmentId,
                                maxScore: assessment.maxScore
                            }));

                            allResults.push(...mappedResults);
                        } catch (assessmentErr) {
                            console.error(`Error processing assessment ${assessment.assessmentId}:`, assessmentErr);
                            continue;
                        }
                    }
                } catch (courseErr) {
                    console.error(`Error processing course ${course.courseId}:`, courseErr);
                    continue;
                }
            }

            // Sort results by attempt date (most recent first)
            allResults.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
            setResults(allResults);
        } catch (err) {
            console.error('Error fetching results:', err);
            setError(err.message || 'Failed to load results');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredResults = () => {
        return results.filter(result => {
            if (filter.course !== 'all' && result.courseId !== filter.course) return false;
            if (filter.assessment !== 'all' && result.assessmentId !== filter.assessment) return false;
            if (filter.student !== 'all' && result.userId !== filter.student) return false;
            return true;
        });
    };

    const getUniqueCourses = () => {
        const courses = results.map(r => ({ id: r.courseId, title: r.courseTitle }));
        return [...new Map(courses.map(c => [c.id, c])).values()];
    };

    const getUniqueAssessments = () => {
        const assessments = results.map(r => ({ id: r.assessmentId, title: r.assessmentTitle }));
        return [...new Map(assessments.map(a => [a.id, a])).values()];
    };

    const getUniqueStudents = () => {
        const uniqueStudents = new Map();
        results.forEach(result => {
            if (!uniqueStudents.has(result.userId)) {
                uniqueStudents.set(result.userId, {
                    userId: result.userId,
                    userName: result.userName || 'Unknown Student'
                });
            }
        });
        return Array.from(uniqueStudents.values());
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Student Assessment Results</h2>
                <Link to="/instructor-dashboard" className="btn btn-outline-primary">
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Dashboard
                </Link>
            </div>

            {/* Filters */}
            <div className="card bg-dark text-light mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Course</label>
                            <select 
                                className="form-select bg-dark text-light border-secondary"
                                value={filter.course}
                                onChange={(e) => setFilter(prev => ({ ...prev, course: e.target.value }))}
                            >
                                <option value="all">All Courses</option>
                                {getUniqueCourses().map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4 mb-3 text-white">
                            <label className="form-label">Assessment</label>
                            <select 
                                className="form-select bg-dark text-light border-secondary"
                                value={filter.assessment}
                                onChange={(e) => setFilter(prev => ({ ...prev, assessment: e.target.value }))}
                            >
                                <option value="all">All Assessments</option>
                                {getUniqueAssessments().map(assessment => (
                                    <option key={assessment.id} value={assessment.id}>
                                        {assessment.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Student</label>
                            <select 
                                className="form-select bg-dark text-light border-secondary"
                                value={filter.student}
                                onChange={(e) => setFilter(prev => ({ ...prev, student: e.target.value }))}
                            >
                                <option value="all">All Students</option>
                                {getUniqueStudents().map(student => (
                                    <option key={student.userId} value={student.userId}>
                                        {student.userName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="alert alert-info">
                    No assessment results available yet.
                </div>
            ) : (
                <div className="row">
                    {getFilteredResults().map((result) => (
                        <div key={result.resultId} className="col-md-4 mb-4">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="card h-100 shadow-sm"
                                style={{ backgroundColor: '#000', color: '#fff' }}
                            >
                                <div className="card-body">
                                    <h5 className="card-title">{result.assessmentTitle}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{result.courseTitle}</h6>
                                    <div className="mb-3">
                                        <span className="badge bg-primary me-2">
                                            Score: {result.score} / {result.maxScore}
                                        </span>
                                        <span className="badge bg-success">
                                            {Math.round((result.score / result.maxScore) * 100)}%
                                        </span>
                                    </div>
                                    <p className="card-text text-muted">
                                        Student: {result.userName || 'Unknown Student'}
                                    </p>
                                    <p className="card-text text-muted">
                                        Attempted on: {new Date(result.attemptDate).toLocaleDateString()}
                                    </p>
                                    <div className="d-flex gap-2">
                                        <Link 
                                            to={`/assessment-results/${result.assessmentId}`}
                                            className="btn btn-primary flex-grow-1"
                                        >
                                            <i className="bi bi-eye me-2"></i>
                                            View Details
                                        </Link>
                                        <Link 
                                            to={`/student-results/${result.userId}`}
                                            className="btn btn-outline-primary"
                                        >
                                            <i className="bi bi-person me-2"></i>
                                            Student
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InstructorResults; 