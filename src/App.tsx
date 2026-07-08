import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Component layout and guards
import { Protected } from './components/Protected';
import { Layout } from './components/Layout';

// Page components
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MentorApplications } from './pages/MentorApplications';
import { Users } from './pages/Users';
import { Mentors } from './pages/Mentors';
import { Bookings } from './pages/Bookings';
import { Sessions } from './pages/Sessions';
import { Community } from './pages/Community';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public login page */}
              <Route path="/login" element={<Login />} />

              {/* Protected admin dashboard routes */}
              <Route
                path="/"
                element={
                  <Protected>
                    <Layout />
                  </Protected>
                }
              >
                {/* Redirect base root to dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="applications" element={<MentorApplications />} />
                <Route path="users" element={<Users />} />
                <Route path="mentors" element={<Mentors />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="community" element={<Community />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                
                {/* Catch-all 404 inside layout */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
