import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BooksPage from './pages/BooksPage.jsx';
import BookDetailsPage from './pages/BookDetailsPage.jsx';
import BorrowedBooksPage from './pages/BorrowedBooksPage.jsx';
import ReservationsPage from './pages/ReservationsPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminReviewsPage from './pages/AdminReviewsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
        <Route path="/books/:id" element={<ProtectedRoute><BookDetailsPage /></ProtectedRoute>} />
        <Route path="/borrowed" element={<ProtectedRoute><BorrowedBooksPage /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['librarian', 'admin']}><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute roles={['librarian', 'admin']}><AdminReviewsPage /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}
