import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const handleDeleteAssessment = async (assessmentId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`http://localhost:7197/api/Assessments/${assessmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete assessment');
            }

            setAssessments(assessments.filter(assessment => assessment.assessmentId !== assessmentId));
        } catch (err) {
            console.error('Error deleting assessment:', err);
            setError(err.message);
        }
    };

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch course details
                const courseResponse = await fetch(`http://localhost:7197/api/Courses/${courseId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!courseResponse.ok) {
                    throw new Error('Failed to fetch course details');
                }

                const courseData = await courseResponse.json();
                setCourse(courseData);

                // Fetch assessments for the course
                const assessmentsResponse = await fetch(`http://localhost:7197/api/Assessments/course/${courseId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!assessmentsResponse.ok) {
                    throw new Error('Failed to fetch assessments');
                }

                const assessmentsData = await assessmentsResponse.json();
                setAssessments(Array.isArray(assessmentsData) ? assessmentsData : 
                             (assessmentsData.$values && Array.isArray(assessmentsData.$values)) ? assessmentsData.$values : []);

            } catch (err) {
                console.error('Error fetching course details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [courseId]);

    const handleDownload = (fileKey) => {
        const fileData = localStorage.getItem(fileKey);
        if (fileData) {
            const link = document.createElement('a');
            link.href = fileData;
            link.download = course.localFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return (
            <div className="container mt-5 bg-black text-light">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5 bg-black text-light">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mt-5 bg-black text-light">
                <div className="alert alert-warning" role="alert">
                    Course not found
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-4 bg-black text-light">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm bg-black text-light">
                        <div className="row g-0">
                            <div className="col-md-4">
                                {course.mediaUrl ? (
                                    <img 
                                        src={course.mediaUrl} 
                                        className="img-fluid rounded-start h-100" 
                                        alt={course.title}
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="bg-dark h-100 d-flex align-items-center justify-content-center">
                                        <i className="bi bi-book text-muted" style={{ fontSize: '5rem' }}></i>
                                    </div>
                                )}
                            </div>
                            <div className="col-md-8">
                                <div className="card-body">
                                    <h1 className="card-title mb-3">{course.title}</h1>
                                    <p className="card-text text-white mb-4">{course.description}</p>
                                    <div className="d-flex align-items-center mb-3">
                                        {/* <img 
                                            src={course.instructor?.profilePicture || 'https://via.placeholder.com/40'} 
                                            className="rounded-circle me-2" 
                                            alt={course.instructor?.name}
                                            style={{ width: '40px', height: '40px' }}
                                        /> */}
                                        <div>
                                            <h6 className="mb-0">Instructor</h6>
                                            <p className="text-white mb-0">{course.instructor?.name}</p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-primary">
                                            <i className="bi bi-play-fill me-2"></i>
                                            Start Learning
                                        </button>
                                        <button className="btn btn-outline-primary">
                                            <i className="bi bi-share me-2"></i>
                                            Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <ul className="nav nav-tabs mb-4 bg-black">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'content' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('content')}
                            >
                                Course Content
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'materials' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('materials')}
                            >
                                Materials
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content bg-black">
                        {activeTab === 'overview' && (
                            <div className="card border-0 shadow-sm bg-black text-light">
                                <div className="card-body">
                                    <h4 className="card-title mb-4">Course Overview</h4>
                                    <div className="mb-4">
                                        <h5>What you'll learn</h5>
                                        <ul className="list-unstyled">
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Understanding of key concepts
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Practical application of knowledge
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Hands-on experience with real-world examples
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5>Requirements</h5>
                                        <ul className="list-unstyled">
                                            <li className="mb-2">
                                                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                                                Basic understanding of the subject
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                                                Willingness to learn and practice
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="card border-0 shadow-sm bg-black text-light">
                                <div className="card-body">
                                    <h4 className="card-title mb-4">Course Content</h4>
                                    {course.courseUrl && (
                                        <div className="mb-4">
                                            <div className="ratio ratio-16x9">
                                                <iframe 
                                                    src={course.courseUrl}
                                                    title="Course Video"
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    className="rounded"
                                                ></iframe>
                                            </div>
                                        </div>
                                    )}
                                    <div className="accordion" id="courseContent">
                                        <div className="accordion-item bg-black text-light">
                                            <h2 className="accordion-header">
                                                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#module1">
                                                    Module 1: Introduction
                                                </button>
                                            </h2>
                                            <div id="module1" className="accordion-collapse collapse show" data-bs-parent="#courseContent">
                                                <div className="accordion-body">
                                                    <ul className="list-group list-group-flush">
                                                        <li className="list-group-item d-flex justify-content-between align-items-center bg-black text-light">
                                                            <span>
                                                                <i className="bi bi-play-circle me-2"></i>
                                                                Welcome to the Course
                                                            </span>
                                                            <span className="badge bg-primary rounded-pill">5 min</span>
                                                        </li>
                                                        <li className="list-group-item d-flex justify-content-between align-items-center bg-black text-light">
                                                            <span>
                                                                <i className="bi bi-play-circle me-2"></i>
                                                                Course Overview
                                                            </span>
                                                            <span className="badge bg-primary rounded-pill">10 min</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'materials' && (
                            <div className="card border-0 shadow-sm bg-black text-light">
                                <div className="card-body">
                                    <h4 className="card-title mb-4">Course Materials</h4>
                                    {course.localFile ? (
                                        <div className="card mb-3 bg-black text-light">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-file-earmark-text text-primary me-3" style={{ fontSize: '2rem' }}></i>
                                                    <div className="flex-grow-1">
                                                        <h5 className="mb-1">{course.localFile.name}</h5>
                                                        <p className="text-muted mb-0">
                                                            {course.localFile.type === 'application/pdf' ? 'PDF Document' : 'Word Document'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        className="btn btn-primary"
                                                        onClick={() => handleDownload(course.localFile.key)}
                                                    >
                                                        <i className="bi bi-download me-2"></i>
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info">
                                            No course materials available yet.
                                        </div>
                                    )}
                                    <div className="mt-5">
                                        <h3 className="card-title mb-4">Assessments</h3>
                                        {assessments.length > 0 ? (
                                            <div className="row">
                                                {assessments.map((assessment) => (
                                                    <div key={assessment.assessmentId} className="col-md-6 mb-4">
                                                        <div className="card bg-dark text-light h-100">
                                                            <div className="card-body">
                                                                <h5 className="card-title">{assessment.title}</h5>
                                                                <div className="mb-3">
                                                                    <span className="badge bg-primary me-2">
                                                                        <i className="bi bi-question-circle me-1"></i>
                                                                        {assessment.questionCount} Questions
                                                                    </span>
                                                                    <span className="badge bg-success">
                                                                        <i className="bi bi-star me-1"></i>
                                                                        Max Score: {assessment.maxScore}
                                                                    </span>
                                                                </div>
                                                                <p className="card-text text-muted">
                                                                    Test your knowledge and understanding of the course material.
                                                                </p>
                                                            </div>
                                                            <div className="card-footer bg-transparent border-top-0">
                                                                {user?.role === 'Instructor' ? (
                                                                    <div className="d-flex gap-2">
                                                                        <Link
                                                                            to={`/edit-assessment/${assessment.assessmentId}`}
                                                                            className="btn btn-primary flex-grow-1"
                                                                        >
                                                                            <i className="bi bi-pencil me-2"></i>
                                                                            Edit Assessment
                                                                        </Link>
                                                                        <button
                                                                            className="btn btn-danger flex-grow-1"
                                                                            onClick={() => {
                                                                                if (window.confirm('Are you sure you want to delete this assessment?')) {
                                                                                    handleDeleteAssessment(assessment.assessmentId);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-trash me-2"></i>
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <Link
                                                                        to={`/assessment/${assessment.assessmentId}`}
                                                                        className="btn btn-success w-100"
                                                                    >
                                                                        <i className="bi bi-pencil-square me-2"></i>
                                                                        Take Assessment
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="alert alert-info">
                                                <i className="bi bi-info-circle me-2"></i>
                                                No assessments available for this course yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm mb-4 bg-black text-light">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Course Features</h5>
                            <ul className="list-unstyled">
                                <li className="mb-3">
                                    <i className="bi bi-clock text-primary me-2"></i>
                                    Duration: 2 hours
                                </li>
                                <li className="mb-3">
                                    <i className="bi bi-book text-primary me-2"></i>
                                    Lessons: 12
                                </li>
                                <li className="mb-3">
                                    <i className="bi bi-people text-primary me-2"></i>
                                    Students: 1,234
                                </li>
                                <li className="mb-3">
                                    <i className="bi bi-star text-primary me-2"></i>
                                    Rating: 4.5/5
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm bg-black text-light">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Instructor</h5>
                            <div className="d-flex align-items-center mb-3">
                                {/* <img 
                                    src={course.instructor?.profilePicture || 'https://via.placeholder.com/60'} 
                                    className="rounded-circle me-3" 
                                    alt={course.instructor?.name}
                                    style={{ width: '60px', height: '60px' }}
                                /> */}
                                <div>
                                    <h6 className="mb-1">{course.instructor?.name}</h6>
                                    <p className="text-white mb-0">Course Instructor</p>
                                </div>
                            </div>
                            <p className="card-text">
                                Experienced instructor with a passion for teaching and helping students succeed.
                            </p>
                            <button className="btn btn-outline-primary w-100">
                                <i className="bi bi-envelope me-2"></i>
                                Contact Instructor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
