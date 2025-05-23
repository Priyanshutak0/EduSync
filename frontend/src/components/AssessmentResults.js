import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import './Course.css';

const AssessmentResults = () => {
    const { assessmentId } = useParams();
    const [results, setResults] = useState([]);
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };

                const [assessmentResponse, resultsResponse] = await Promise.all([
                    axios.get(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_ID(assessmentId)}`, { headers }),
                    axios.get(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(assessmentId)}`, { headers })
                ]);
                setAssessment(assessmentResponse.data);
                setResults(resultsResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load assessment results. Please try again.');
                setLoading(false);
            }
        };

        fetchData();
    }, [assessmentId]);

    if (loading) return <div>Loading results...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!assessment) return <div>Assessment not found</div>;

    const calculateAverageScore = () => {
        if (results.length === 0) return 0;
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        return Math.round((totalScore / results.length / assessment.maxScore) * 100);
    };

    return (
        <div className="assessment-results-container">
            <h2>Assessment Results: {assessment.title}</h2>
            
            <div className="results-summary">
                <h3>Summary</h3>
                <p>Total Attempts: {results.length}</p>
                <p>Average Score: {calculateAverageScore()}%</p>
            </div>

            <div className="results-list">
                <h3>Student Results</h3>
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Attempt Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{color: 'white'}}>
                        {results.map(result => (
                            <tr key={result.resultId}>
                                <td>{result.studentName}</td>
                                <td>{result.score} / {assessment.maxScore}</td>
                                <td>{Math.round((result.score / assessment.maxScore) * 100)}%</td>
                                <td>{new Date(result.attemptDate).toLocaleString()}</td>
                                <td>
                                    <button 
                                        className="view-details-btn"
                                        onClick={() => window.location.href = `/results/${result.resultId}`}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssessmentResults; 