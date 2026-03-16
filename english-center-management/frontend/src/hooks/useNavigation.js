import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();

  const navigateToHome = (user) => {
    const userRole = user?.role?.toLowerCase();
    
    if (userRole === 'admin') {
      navigate('/');
    } else if (userRole === 'teacher') {
      navigate('/teacher/dashboard');
    } else if (userRole === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/login');
    }
  };

  const navigateToHomeWindow = (user) => {
    const userRole = user?.role?.toLowerCase();
    
    if (userRole === 'admin') {
      window.location.href = '/';
    } else if (userRole === 'teacher') {
      window.location.href = '/teacher/dashboard';
    } else if (userRole === 'student') {
      window.location.href = '/student/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return {
    navigateToHome,
    navigateToHomeWindow
  };
};
