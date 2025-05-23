import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const Assessment = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_ID(assessmentId)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch assessment');
                }

                const data = await response.json();
                // Handle the $values property in the response
                const assessmentData = data.$values ? data.$values[0] : data;
                // Ensure questions is an array
                if (assessmentData.questions && assessmentData.questions.$values) {
                    assessmentData.questions = assessmentData.questions.$values;
                }
                setAssessment(assessmentData);
                
                // Initialize answers object
                const initialAnswers = {};
                if (assessmentData.questions) {
                    assessmentData.questions.forEach(question => {
                        initialAnswers[question.questionId] = null;
                    });
                }
                setAnswers(initialAnswers);

            } catch (err) {
                console.error('Error fetching assessment:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [assessmentId]);

    const handleAnswerSelect = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Check if all questions are answered
            const unansweredQuestions = Object.entries(answers).filter(([_, value]) => value === null);
            if (unansweredQuestions.length > 0) {
                alert('Please answer all questions before submitting.');
                return;
            }

            const submission = {
                assessmentId: assessment.assessmentId,
                userId: user.userId,
                answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                    questionId,
                    selectedOptionId
                }))
            };

            console.log('Submitting assessment:', {
                endpoint: `${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.SUBMIT}`,
                submission
            });

            const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.SUBMIT}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submission)
            });

            console.log('Submission response status:', response.status);
            console.log('Submission response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Submission error response:', errorText);
                throw new Error(`Failed to submit assessment: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            console.log('Submission successful, result:', result);
            
            // Store the result ID in localStorage as an array
            const existingResults = JSON.parse(localStorage.getItem(`results_${assessment.assessmentId}`) || '[]');
            existingResults.push(result.resultId);
            localStorage.setItem(`results_${assessment.assessmentId}`, JSON.stringify(existingResults));
            
            setResult(result);
            setSubmitted(true);

        } catch (err) {
            console.error('Error submitting assessment:', err);
            setError(err.message);
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

    if (!assessment) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning" role="alert">
                    Assessment not found
                </div>
            </div>
        );
    }

    if (submitted && result) {
        return (
            <div className="container mt-5">
                <div className="card">
                    <div className="card-body text-center">
                        <h2 className="card-title mb-4">Assessment Results</h2>
                        <div className="mb-4">
                            <h3>Score: {result.score} / {assessment.questions.length}</h3>
                            <p className="text-muted">
                                Percentage: {Math.round((result.score / assessment.questions.length) * 100)}%
                            </p>
                        </div>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate(-1)}
                        >
                            Back to Course
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Ensure questions is an array before mapping
    const questions = assessment.questions || [];

    return (
        <div className="container mt-5">
            <div className="card">
                <div className="card-body">
                    <h2 className="card-title mb-4">{assessment.title}</h2>
                    <p className="text-muted mb-4">
                        Total Questions: {questions.length} | 
                        Maximum Score: {assessment.maxScore}
                    </p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}>
                        {questions.map((question, index) => (
                            <div key={question.questionId} className="mb-4">
                                <h5 className="mb-3">
                                    Question {index + 1}: {question.questionText}
                                </h5>
                                <div className="list-group">
                                    {question.options && question.options.$values ? 
                                        question.options.$values.map(option => (
                                            <label 
                                                key={option.optionId}
                                                className={`list-group-item list-group-item-action ${
                                                    answers[question.questionId] === option.optionId ? 'active' : ''
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.questionId}`}
                                                    value={option.optionId}
                                                    checked={answers[question.questionId] === option.optionId}
                                                    onChange={() => handleAnswerSelect(question.questionId, option.optionId)}
                                                    className="me-2"
                                                />
                                                {option.text}
                                            </label>
                                        )) :
                                        question.options && question.options.map(option => (
                                            <label 
                                                key={option.optionId}
                                                className={`list-group-item list-group-item-action ${
                                                    answers[question.questionId] === option.optionId ? 'active' : ''
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.questionId}`}
                                                    value={option.optionId}
                                                    checked={answers[question.questionId] === option.optionId}
                                                    onChange={() => handleAnswerSelect(question.questionId, option.optionId)}
                                                    className="me-2"
                                                />
                                                {option.text}
                                            </label>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}

                        <div className="d-grid gap-2">
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg"
                            >
                                Submit Assessment
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Assessment; 