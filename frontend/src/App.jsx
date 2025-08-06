// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import HomePage from './pages/HomePage';
import ApartmentsPage from './pages/ApartmentsPage';
import ApartmentDetailPage from './pages/ApartmentDetailPage';
import BookingPage from './pages/BookingPage';
import { SignInPage, SignUpPage } from './pages/SignInPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApartments from './pages/admin/AdminApartments';
import AdminBookings from './pages/admin/AdminBookings';
import AdminNews from './pages/admin/AdminNews';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/apartmanok" element={<ApartmentsPage />} />
              <Route path="/apartmanok/:id" element={<ApartmentDetailPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              
              {/* Protected Routes */}
              <Route path="/foglalas/:apartmentId" element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } />
              
              <Route path="/fiokom" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="/admin/apartmanok" element={
                <AdminRoute>
                  <AdminApartments />
                </AdminRoute>
              } />
              
              <Route path="/admin/foglalasok" element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              } />
              
              <Route path="/admin/hirek" element={
                <AdminRoute>
                  <AdminNews />
                </AdminRoute>
              } />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;