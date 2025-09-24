import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Pricing from './pages/Pricing'
import SystemTest from './pages/SystemTest'
import AITest from './pages/AITest'
import EnhancedDashboard from './pages/EnhancedDashboard'
import Phase3Progress from './pages/Phase3Progress'
import Phase3Integration from './pages/Phase3Integration'
import ModelManagement from './pages/ModelManagement'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <AnimatePresence mode="wait">
            <Routes>
              <Route 
                path="/" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LandingPage />
                  </motion.div>
                } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dashboard />
                  </motion.div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/portfolio" 
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Portfolio />
                  </motion.div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pricing" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Pricing />
                </motion.div>
              } 
            />
            <Route 
              path="/test" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SystemTest />
                </motion.div>
              } 
            />
            <Route 
              path="/ai-test" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AITest />
                </motion.div>
              } 
            />
            <Route 
              path="/enhanced-dashboard" 
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EnhancedDashboard />
                  </motion.div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phase3-progress" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Phase3Progress />
                </motion.div>
              } 
            />
            <Route 
              path="/phase3-integration" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Phase3Integration />
                </motion.div>
              } 
            />
            <Route 
              path="/model-management" 
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ModelManagement />
                  </motion.div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AnimatePresence>
        <Footer />
      </div>
    </Router>
    </AuthProvider>
  )
}

export default App
