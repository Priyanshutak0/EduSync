import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import authService, { ROLES } from './services/authService';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './components/Home';
import Courses from './components/Courses';
import Assessments from './components/Assessments';
import Results from './components/Results';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import AvailableCourses from './components/AvailableCourses';
import CreateCourse from './components/CreateCourse';
import CourseDetails from './components/CourseDetails';
import LandingPage from './components/LandingPage';
import CreateAssessment from './components/CreateAssessment';
import TakeAssessment from './components/TakeAssessment';
import ViewAssessmentResult from './components/ViewAssessmentResult';
import AssessmentResults from './components/AssessmentResults';
import Assessment from './components/Assessment';
import AllResults from './components/AllResults';
import InstructorResults from './components/InstructorResults';
import EditAssessment from './components/EditAssessment';
import './App.css';

// Role-based Protected Route component
const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        return <Navigate to={user.role === ROLES.INSTRUCTOR ? '/instructor-dashboard' : '/student-dashboard'} />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/landing" element={<LandingPage />} />

                    {/* Protected routes */}
                    <Route
                        path="/courses"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Courses />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/assessments"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Assessments />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/results"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Results />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Student routes */}
                    <Route
                        path="/student-dashboard"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                                <Layout>
                                    <StudentDashboard />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/all-results"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                                <Layout>
                                    <AllResults />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/available-courses"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                                <Layout>
                                    <AvailableCourses />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/take-assessment/:assessmentId"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                                <Layout>
                                    <TakeAssessment />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/results/:resultId"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ViewAssessmentResult />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Instructor routes */}
                    <Route
                        path="/instructor-dashboard"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                                <Layout>
                                    <InstructorDashboard />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-course"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                                <Layout>
                                    <CreateCourse />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-assessment/:courseId"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                                <Layout>
                                    <CreateAssessment />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/assessment-results/:assessmentId"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                                <Layout>
                                    <AssessmentResults />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />
                    <Route
                        path="/instructor-results"
                        element={
                            <RoleProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                                <Layout>
                                    <InstructorResults />
                                </Layout>
                            </RoleProtectedRoute>
                        }
                    />

                    {/* Course details route */}
                    <Route
                        path="/course/:courseId" 
                        element={
                            <Layout>
                                <CourseDetails />
                            </Layout>
                        } 
                    />

                    {/* Assessment route */}
                    <Route path="/assessment/:assessmentId" element={<Assessment />} />
                    <Route path="/edit-assessment/:assessmentId" element={<EditAssessment />} />

                    {/* Default route - redirect based on authentication status */}
                    <Route
                        path="/"
                        element={
                            authService.isAuthenticated() ? (
                                <Navigate
                                    to={
                                        authService.isInstructor()
                                            ? '/instructor-dashboard'
                                            : '/student-dashboard'
                                    }
                                />
                            ) : (
                                <Navigate to="/landing" />
                            )
                        }
                    />

                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
