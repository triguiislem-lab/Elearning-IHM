import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./components/Common/ToastProvider";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LoadingSpinner from "./components/Common/OptimizedLoadingSpinner";
import Navbar from "./components/Navbar/Navbar";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetails from "./components/SubjectCard/CourseDetails";
import ModulePage from "./pages/ModulePage";
import SpecialtiesPage from "./pages/SpecialtiesPage";
import SpecialtyDetailPage from "./pages/SpecialtyDetailPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ResetPassword from "./pages/Auth/ResetPassword";
import Footer from "./components/Footer/Footer";
import Profile from "./pages/Profile/Profile";
import MyCourses from "./pages/Profile/MyCourses";
import EditProfile from "./pages/Profile/EditProfile";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";

import SpecialitesManager from "./pages/Admin/SpecialitesManager";
import AdminCourseForm from "./pages/Admin/CourseForm";
import UserManagement from "./pages/Admin/UserManagement";
import CourseManagement from "./pages/Admin/CourseManagement";
import DatabaseStandardization from "./pages/Admin/DatabaseStandardization";
import InstructorCourseForm from "./pages/Instructor/CourseForm";
import InstructorCourses from "./pages/Instructor/MyCourses";
import InstructorCourseManagement from "./pages/Instructor/InstructorCourseManagement";
import MessagesPage from "./pages/Messages/MessagesPage";
import NotFound from "./pages/NotFound";

// Test pages
import ResourceEvaluationTestPage from "./pages/TestPages/ResourceEvaluationTestPage";
import ResourceCreationTestPage from "./pages/TestPages/ResourceCreationTestPage";
import ModuleDebugPage from "./pages/TestPages/ModuleDebugPage";
import ModuleDebugPageUpdated from "./pages/TestPages/ModuleDebugPageUpdated";

// Import the new layout
import AdminLayout from "./components/Layout/AdminLayout";

// Redirect components
import ProfileRedirect from "./components/Redirects/ProfileRedirect";
import EditProfileRedirect from "./components/Redirects/EditProfileRedirect";
import MessagesRedirect from "./components/Redirects/MessagesRedirect";

// Import layout components
import StudentLayout from "./components/Layout/StudentLayout";
import InstructorLayout from "./components/Layout/InstructorLayout";

const App = () => {
  const { loading, userRole, getDashboardPath } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <div className="flex flex-col min-h-screen overflow-x-hidden">
            <Navbar />
            <main className="flex-grow pt-20">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/about"
                  element={<Navigate to="/#about" replace />}
                />
                <Route
                  path="/contact"
                  element={<Navigate to="/#contact" replace />}
                />
                <Route
                  path="/resources"
                  element={<Navigate to="/#resources" replace />}
                />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route
                  path="/terms-of-service"
                  element={<TermsOfServicePage />}
                />
                <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/course/:id" element={<CourseDetails />} />
                <Route
                  path="/course/:id/module/:moduleId"
                  element={<ModulePage />}
                />
                <Route path="/specialites" element={<SpecialtiesPage />} />
                <Route
                  path="/specialite/:id"
                  element={<SpecialtyDetailPage />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Role-based redirects */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfileRedirect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-profile"
                  element={
                    <ProtectedRoute>
                      <EditProfileRedirect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MessagesRedirect />
                    </ProtectedRoute>
                  }
                />

                {/* Student routes */}
                <Route path="/student" element={<StudentLayout />}>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="enrollments" element={<MyCourses />} />
                  <Route
                    path="my-courses"
                    element={<Navigate to="/student/enrollments" replace />}
                  />
                  <Route path="edit-profile" element={<EditProfile />} />
                  <Route path="messages" element={<MessagesPage />} />
                </Route>

                {/* Instructor routes */}
                <Route path="/instructor" element={<InstructorLayout />}>
                  <Route
                    path="dashboard"
                    element={<Navigate to="/instructor/courses" replace />}
                  />
                  <Route path="courses" element={<InstructorCourses />} />
                  <Route
                    path="course-management/:id"
                    element={<InstructorCourseManagement />}
                  />
                  <Route
                    path="course-form"
                    element={<InstructorCourseForm />}
                  />
                  <Route
                    path="course-form/:id"
                    element={<InstructorCourseForm />}
                  />
                  <Route path="profile" element={<Profile />} />
                  <Route path="edit-profile" element={<EditProfile />} />
                  <Route path="messages" element={<MessagesPage />} />
                </Route>

                {/* Admin routes - Protection is now handled by AdminLayout */}
                <Route path="/admin" element={<AdminLayout />}>
                  {/* Nested admin routes render inside AdminLayout's Outlet */}
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="edit-profile" element={<EditProfile />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="courses" element={<CourseManagement />} />

                  <Route path="specialites" element={<SpecialitesManager />} />
                  <Route path="course-form" element={<AdminCourseForm />} />
                  <Route path="course-form/:id" element={<AdminCourseForm />} />
                  <Route
                    path="database-standardization"
                    element={<DatabaseStandardization />}
                  />
                </Route>

                {/* Test pages */}
                <Route
                  path="/test/resource-evaluation"
                  element={<ResourceEvaluationTestPage />}
                />
                <Route
                  path="/test/resource-evaluation/:courseId/:moduleId"
                  element={<ResourceEvaluationTestPage />}
                />
                <Route
                  path="/test/resource-creation"
                  element={<ResourceCreationTestPage />}
                />
                <Route
                  path="/test/resource-creation/:courseId/:moduleId"
                  element={<ResourceCreationTestPage />}
                />
                <Route
                  path="/test/module-debug"
                  element={<ModuleDebugPageUpdated />}
                />
                <Route
                  path="/test/module-debug/:courseId"
                  element={<ModuleDebugPageUpdated />}
                />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
