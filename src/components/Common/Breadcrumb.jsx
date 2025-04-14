import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ customPaths }) => {
  const location = useLocation();
  
  // Generate paths from the current location
  const generatePaths = () => {
    if (customPaths) return customPaths;
    
    const pathnames = location.pathname.split('/').filter(x => x);
    
    // Create path objects with name and url
    return pathnames.map((name, index) => {
      const url = `/${pathnames.slice(0, index + 1).join('/')}`;
      
      // Format the name to be more readable
      const formattedName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return { name: formattedName, url };
    });
  };
  
  const paths = generatePaths();
  
  return (
    <nav className="flex items-center text-sm py-4" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        <li className="flex items-center">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-secondary transition-colors duration-200 flex items-center"
          >
            <Home size={16} className="mr-1" />
            Accueil
          </Link>
        </li>
        
        {paths.map((path, index) => (
          <li key={path.url} className="flex items-center">
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            {index === paths.length - 1 ? (
              <span className="text-secondary font-medium" aria-current="page">
                {path.name}
              </span>
            ) : (
              <Link 
                to={path.url} 
                className="text-gray-500 hover:text-secondary transition-colors duration-200"
              >
                {path.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
