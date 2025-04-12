import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LoadingSpinner from "./components/Common/OptimizedLoadingSpinner";
import Navbar from "./components/Navbar/Navbar";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetails from "./components/SubjectCard/CourseDetails";
import ModulePage from "./pages/ModulePage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Footer from "./components/Footer/Footer";
import Profile from "./pages/Profile/Profile";
import MyCourses from "./pages/Profile/MyCourses";
import EditProfile from "./pages/Profile/EditProfile";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import DatabaseCleanup from "./pages/Admin/DatabaseCleanup";
import DatabaseMigration from "./pages/Admin/DatabaseMigration";
import SpecialitesManager from "./pages/Admin/SpecialitesManager";
import AdminCourseForm from "./pages/Admin/CourseForm";
import InstructorCourseForm from "./pages/Instructor/CourseForm";
import InstructorCourses from "./pages/Instructor/MyCourses";
import InstructorCourseManagement from "./pages/Instructor/InstructorCourseManagement";
import MessagesPage from "./pages/Messages/MessagesPage";
import NotFound from "./pages/NotFound";

// Redirect components
import ProfileRedirect from "./components/Redirects/ProfileRedirect";
import EditProfileRedirect from "./components/Redirects/EditProfileRedirect";
import MessagesRedirect from "./components/Redirects/MessagesRedirect";

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            {/* Ces routes redirigeront vers les sections de la page d'accueil */}
            <Route path="/about" element={<Navigate to="/#about" replace />} />
            <Route
              path="/contact"
              element={<Navigate to="/#contact" replace />}
            />
            <Route
              path="/resources"
              element={<Navigate to="/#resources" replace />}
            />
            <Route path="/course/:id" element={<CourseDetails />} />
            <Route
              path="/course/:id/module/:moduleId"
              element={<ModulePage />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="enrollments" element={<MyCourses />} />
                    <Route path="my-courses" element={<MyCourses />} />
                    <Route path="edit-profile" element={<EditProfile />} />
                    <Route path="messages" element={<MessagesPage />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Instructor routes */}
            <Route
              path="/instructor/*"
              element={
                <ProtectedRoute allowedRoles={["instructor"]}>
                  <Routes>
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
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="edit-profile" element={<EditProfile />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route
                      path="database-cleanup"
                      element={<DatabaseCleanup />}
                    />
                    <Route
                      path="database-migration"
                      element={<DatabaseMigration />}
                    />
                    <Route
                      path="specialites"
                      element={<SpecialitesManager />}
                    />
                    <Route path="course-form" element={<AdminCourseForm />} />
                    <Route
                      path="course-form/:id"
                      element={<AdminCourseForm />}
                    />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
