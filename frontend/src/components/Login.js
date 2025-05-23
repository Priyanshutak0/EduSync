import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../services/authService';
import authService from '../services/authService';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.email || !formData.password) {
                throw new Error('Email and password are required');
            }

            if (!formData.password.trim()) {
                throw new Error('Password cannot be empty');
            }

            await login(formData.email, formData.password);
            
            const userData = authService.getCurrentUser();
            
            if (userData.role === ROLES.INSTRUCTOR) {
                navigate('/instructor-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        {/* HEADER */}
        <header className="bg-dark py-4 px-5 d-flex justify-content-between align-items-center shadow">
            <h1 className="text-primary fw-bold">EduSync</h1>
            <Link to="/register" className="btn btn-primary px-4 py-2">Get Started</Link>
        </header>
        <div className="bg-black text-white min-vh-100 d-flex align-items-center justify-content-center">

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-4">
                        <div className="card bg-dark border-secondary">
                            <div className="card-body p-4">
                                <h2 className="text-center text-primary mb-4">Login</h2>
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label text-white">Email</label>
                                        <input
                                            type="email"
                                            className="form-control bg-dark text-white border-secondary"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label text-white">Password</label>
                                        <input
                                            type="password"
                                            className="form-control bg-dark text-white border-secondary"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={loading}
                                    >
                                        {loading ? 'Logging in...' : 'Login'}
                                    </button>
                                </form>
                                <div className="text-center mt-3">
                                    <p className="text-secondary">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-primary text-decoration-none">
                                            Register here
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default Login; 