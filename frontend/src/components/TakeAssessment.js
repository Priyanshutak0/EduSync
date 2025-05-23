import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Course.css';
import config from '../config';

const TakeAssessment = () => {
    const navigate = useNavigate();
    const { assessmentId } = useParams();
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await axios.get(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_ID(assessmentId)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                // Handle the response format correctly
                const assessmentData = response.data.$values ? response.data.$values[0] : response.data;
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
                setLoading(false);
            } catch (error) {
                console.error('Error fetching assessment:', error);
                setError('Failed to load assessment. Please try again.');
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [assessmentId]);

    const handleAnswerChange = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if all questions are answered
        const unansweredQuestions = Object.entries(answers).filter(([_, value]) => value === null);
        if (unansweredQuestions.length > 0) {
            alert('Please answer all questions before submitting.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.SUBMIT}`, {
                assessmentId,
                userId: localStorage.getItem('userId'),
                answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                    questionId,
                    selectedOptionId
                }))
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.status === 200) {
                navigate(`/results/${response.data.resultId}`);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('Failed to submit assessment. Please try again.');
        }
    };

    if (loading) return <div>Loading assessment...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!assessment) return <div>Assessment not found</div>;

    return (
        <div className="take-assessment-container">
            <h2>{assessment.title}</h2>
            <form onSubmit={handleSubmit}>
                {assessment.questions.map((question, index) => (
                    <div key={question.questionId} className="question-container">
                        <h3>Question {index + 1}</h3>
                        <p>{question.questionText}</p>
                        <div className="options-container">
                            {question.options.map(option => (
                                <div key={option.optionId} className="option-container">
                                    <label>
                                        <input
                                            type="radio"
                                            name={`question-${question.questionId}`}
                                            value={option.optionId}
                                            checked={answers[question.questionId] === option.optionId}
                                            onChange={() => handleAnswerChange(question.questionId, option.optionId)}
                                        />
                                        {option.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <button type="submit" className="submit-btn">
                    Submit Assessment
                </button>
            </form>
        </div>
    );
};

export default TakeAssessment; 