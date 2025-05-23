import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LandingPage() {
  return (
    <div className="bg-black text-white min-vh-100 d-flex flex-column">
      <header className="bg-dark py-4 px-5 d-flex justify-content-between align-items-center shadow">
        <h1 className="text-primary fw-bold">EduSync</h1>
        <Link to="/register" className="btn btn-primary px-4 py-2">Get Started</Link>
      </header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="display-4 fw-bold text-white mb-3">
            Empowering Learning with <span className="text-primary">EduSync</span>
          </h2>
          <p className="lead text-secondary mb-4">
            Your personalized platform for managing courses, quizzes, and tracking academic performance with ease.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">Explore Now</Link>
        </motion.div>
      </main>

      <section className="bg-black text-center py-5">
        <motion.h3
          className="text-white mb-4 fw-bold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Why Choose EduSync?
        </motion.h3>
        <div className="container">
          <div className="row g-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="col-md-4"
            >
              <div className="bg-dark rounded-4 p-4 shadow h-100">
                <h5 className="text-primary mb-2">Interactive Courses</h5>
                <p className="text-secondary">Engage with high-quality content and real-time feedback.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="col-md-4"
            >
              <div className="bg-dark rounded-4 p-4 shadow h-100">
                <h5 className="text-primary mb-2">Smart Analytics</h5>
                <p className="text-secondary">Track progress and performance with insightful dashboards.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="col-md-4"
            >
              <div className="bg-dark rounded-4 p-4 shadow h-100">
                <h5 className="text-primary mb-2">Quiz & Assessments</h5>
                <p className="text-secondary">Test knowledge with auto-evaluated quizzes and challenges.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="bg-black text-secondary text-center py-3">
        <small>&copy; 2025 EduSync. All rights reserved.</small>
      </footer>
    </div>
  );
}
