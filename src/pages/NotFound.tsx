import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { createRoute } from '@/utils/navigation';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
    console.log('Full URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-sm text-gray-500 mb-4">
          Attempted path: {location.pathname}
        </p>
        <Link
          to={createRoute('/')}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
