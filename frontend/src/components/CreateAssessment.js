import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/Course.css';

const CreateAssessment = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [assessment, setAssessment] = useState({
        title: '',
        maxScore: 1, // Default to 1 point per question
        questions: [
            {
                questionText: '',
                options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]
            }
        ]
    });

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...assessment.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setAssessment({ ...assessment, questions: newQuestions });
    };

    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        const newQuestions = [...assessment.questions];
        newQuestions[questionIndex].options[optionIndex] = {
            ...newQuestions[questionIndex].options[optionIndex],
            [field]: value
        };
        setAssessment({ ...assessment, questions: newQuestions });
    };

    const addQuestion = () => {
        setAssessment({
            ...assessment,
            questions: [
                ...assessment.questions,
                {
                    questionText: '',
                    options: [
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false }
                    ]
                }
            ],
            maxScore: assessment.questions.length + 1 // Update maxScore when adding a question
        });
    };

    const removeQuestion = (index) => {
        const updatedQuestions = assessment.questions.filter((_, i) => i !== index);
        setAssessment({
            ...assessment,
            questions: updatedQuestions,
            maxScore: updatedQuestions.length // Update maxScore when removing a question
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate that each question has exactly one correct answer
            const hasInvalidQuestions = assessment.questions.some(
                question => !question.options.some(option => option.isCorrect)
            );

            if (hasInvalidQuestions) {
                alert('Each question must have exactly one correct answer.');
                return;
            }

            const token = localStorage.getItem('token');
            
            // Create a clean assessment object without circular references
            const assessmentData = {
                assessmentId: crypto.randomUUID(),
                courseId: courseId,
                title: assessment.title,
                maxScore: assessment.questions.length,
                questions: assessment.questions.map(q => ({
                    questionId: crypto.randomUUID(),
                    questionText: q.questionText,
                    options: q.options.map(o => ({
                        optionId: crypto.randomUUID(),
                        text: o.text,
                        isCorrect: o.isCorrect
                    }))
                }))
            };

            const response = await axios.post(
                `${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.CREATE}`,
                assessmentData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201) {
                navigate(`/course/${courseId}`);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response:', error.response.data);
                alert(`Failed to create assessment: ${error.response.data.message || 'Unknown error'}`);
            } else if (error.request) {
                // The request was made but no response was received
                alert('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                alert('Error setting up the request. Please try again.');
            }
        }
    };

    return (
        <div className="create-assessment-container">
            <h2>Create New Assessment</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Assessment Title:</label>
                    <input
                        type="text"
                        value={assessment.title}
                        onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Total Questions: {assessment.questions.length}</label>
                    <p className="help-text">Each question is worth 1 point</p>
                </div>

                {assessment.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="question-container">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3>Question {questionIndex + 1}</h3>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeQuestion(questionIndex)}
                                disabled={assessment.questions.length === 1}
                            >
                                <i className="bi bi-trash"></i> Delete Question
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Question Text:</label>
                            <input
                                type="text"
                                value={question.questionText}
                                onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                                required
                            />
                        </div>

                        <div className="options-container">
                            {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="option-container">
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                        required
                                    />
                                    <label className="correct-option-label">
                                        <input
                                            type="radio"
                                            name={`question-${questionIndex}`}
                                            checked={option.isCorrect}
                                            onChange={() => {
                                                const updatedOptions = question.options.map((opt, idx) => ({
                                                    ...opt,
                                                    isCorrect: idx === optionIndex
                                                }));
                                                handleQuestionChange(questionIndex, 'options', updatedOptions);
                                            }}
                                        />
                                        Correct Answer
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={addQuestion}>
                        Add Question
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Create Assessment
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAssessment; 