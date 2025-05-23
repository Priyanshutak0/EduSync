import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import './Course.css';

const ViewAssessmentResult = () => {
    const { resultId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await axios.get(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ID(resultId)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                setResult(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching result:', error);
                setError('Failed to load result. Please try again.');
                setLoading(false);
            }
        };

        fetchResult();
    }, [resultId]);

    if (loading) return <div>Loading result...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!result) return <div>Result not found</div>;

    // Ensure we have answers to display
    const answers = result.answers || [];

    return (
        <div className="result-container">
            <h2>Assessment Result</h2>
            <div className="result-summary">
                <p>Score: {result.score} out of {result.maxScore}</p>
                <p>Percentage: {Math.round((result.score / result.maxScore) * 100)}%</p>
                <p>Attempt Date: {new Date(result.attemptDate).toLocaleString()}</p>
            </div>

            <div className="answers-review">
                <h3>Your Answers</h3>
                {answers.length > 0 ? (
                    answers.map((answer, index) => (
                        <div key={index} className={`answer-container ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                            <h4>Question {index + 1}</h4>
                            <p>{answer.questionText}</p>
                            <div className="selected-answer">
                                <p>Your Answer: {answer.selectedOptionText}</p>
                                {!answer.isCorrect && answer.allOptions && (
                                    <p className="correct-answer">
                                        Correct Answer: {
                                            answer.allOptions.find(opt => opt.isCorrect)?.text
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="alert alert-info">
                        No detailed answer information available.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewAssessmentResult; 