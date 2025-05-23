import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="container-fluid bg-light min-vh-100">
            <div className="container py-5">
                <div className="text-center">
                    <h1 className="display-4 fw-bold mb-4">
                        <span className="d-block">Welcome to</span>
                        <span className="text-primary">EduSync</span>
                    </h1>
                    <p className="lead text-muted mb-5">
                        Your all-in-one platform for online learning and assessment.
                    </p>
                    <div className="d-flex justify-content-center">
                        {!isAuthenticated ? (
                            <Link
                                to="/register"
                                className="btn btn-primary btn-lg px-5 py-3"
                            >
                                Get started
                            </Link>
                        ) : (
                            <Link
                                to="/courses"
                                className="btn btn-primary btn-lg px-5 py-3"
                            >
                                View Courses
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 