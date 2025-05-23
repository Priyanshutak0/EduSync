import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const AllResults = () => {
    const { user } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllResults = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Get all enrolled courses
                const enrolledResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.COURSES.ENROLLED}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (!enrolledResponse.ok) {
                    throw new Error('Failed to fetch enrolled courses');
                }

                const enrolledCourses = await enrolledResponse.json();
                const processedEnrolledCourses = Array.isArray(enrolledCourses) ? enrolledCourses : 
                                              (enrolledCourses.$values && Array.isArray(enrolledCourses.$values)) ? enrolledCourses.$values : [];

                // Get all results
                const allResults = [];
                for (const course of processedEnrolledCourses) {
                    const assessments = await fetchAssessmentsForCourse(course.courseId);
                    for (const assessment of assessments) {
                        try {
                            // Try fetching by result IDs first
                            const resultIds = JSON.parse(localStorage.getItem(`results_${assessment.assessmentId}`) || '[]');
                            if (resultIds.length > 0) {
                                for (const resultId of resultIds) {
                                    try {
                                        const resultResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ID(resultId)}`, {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json',
                                                'Accept': 'application/json'
                                            }
                                        });

                                        if (resultResponse.ok) {
                                            const result = await resultResponse.json();
                                            const mappedResult = {
                                                ...result,
                                                assessmentTitle: assessment.title,
                                                maxScore: assessment.maxScore
                                            };
                                            allResults.push(mappedResult);
                                        }
                                    } catch (err) {
                                        console.error(`Error fetching result ${resultId}:`, err);
                                    }
                                }
                            }

                            // Try the assessment results endpoint as a fallback
                            const resultsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(assessment.assessmentId)}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });

                            if (resultsResponse.ok) {
                                const results = await resultsResponse.json();
                                const processedResults = Array.isArray(results) ? results : 
                                                      (results.$values && Array.isArray(results.$values)) ? results.$values : [];
                                
                                const userResults = processedResults.filter(result => 
                                    result.userId.toLowerCase() === user.userId.toLowerCase()
                                );
                                
                                const mappedResults = userResults.map(result => ({
                                    ...result,
                                    assessmentTitle: assessment.title,
                                    maxScore: assessment.maxScore
                                }));
                                
                                allResults.push(...mappedResults);
                            }
                        } catch (err) {
                            console.error(`Error processing assessment ${assessment.assessmentId}:`, err);
                        }
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

        fetchAllResults();
    }, [user.userId]);

    const fetchAssessmentsForCourse = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_COURSE(courseId)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return [];
                }
                throw new Error(`Failed to fetch assessments: ${response.status}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : 
                   (data.$values && Array.isArray(data.$values)) ? data.$values : [];
        } catch (err) {
            console.error(`Error fetching assessments for course ${courseId}:`, err);
            return [];
        }
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
                <h2>All Assessment Results</h2>
                <Link to="/dashboard" className="btn btn-outline-primary">
                    Back to Dashboard
                </Link>
            </div>

            {results.length === 0 ? (
                <div className="alert alert-info">
                    No assessment results available yet.
                </div>
            ) : (
                <div className="row">
                    {results.map((result) => (
                        <div key={result.resultId} className="col-md-4 mb-4">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="card h-100 shadow-sm"
                                style={{ backgroundColor: '#000', color: '#fff' }}
                            >
                                <div className="card-body">
                                    <h5 className="card-title">{result.assessmentTitle}</h5>
                                    <div className="mb-3">
                                        <span className="badge bg-primary me-2">
                                            Score: {result.score} / {result.maxScore}
                                        </span>
                                        <span className="badge bg-success">
                                            {Math.round((result.score / result.maxScore) * 100)}%
                                        </span>
                                    </div>
                                    <p className="card-text text-muted">
                                        Attempted on: {new Date(result.attemptDate).toLocaleDateString()}
                                    </p>
                                    <Link 
                                        to={`/results/${result.resultId}`}
                                        className="btn btn-primary w-100"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllResults; 