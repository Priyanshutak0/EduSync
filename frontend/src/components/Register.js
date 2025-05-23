import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../services/authService';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: ROLES.STUDENT
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

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
            await register(formData.name, formData.email, formData.password, formData.role);
            navigate(formData.role === ROLES.INSTRUCTOR ? '/instructor-dashboard' : '/student-dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
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
                                <h2 className="text-center text-primary mb-4">Register</h2>
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label text-white">Name</label>
                                        <input
                                            type="text"
                                            className="form-control bg-dark text-white border-secondary"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
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
                                    <div className="mb-3">
                                        <label htmlFor="role" className="form-label text-white">Role</label>
                                        <select
                                            className="form-select bg-dark text-white border-secondary"
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value={ROLES.STUDENT}>Student</option>
                                            <option value={ROLES.INSTRUCTOR}>Instructor</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={loading}
                                    >
                                        {loading ? 'Registering...' : 'Register'}
                                    </button>
                                </form>
                                <div className="text-center mt-3">
                                    <p className="text-secondary">
                                        Already have an account?{' '}
                                        <Link to="/login" className="text-primary text-decoration-none">
                                            Login here
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

export default Register; 