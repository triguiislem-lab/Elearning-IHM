import { FaComputer, FaBook, FaCode, FaDatabase, FaNetworkWired, FaMobile, FaServer, FaCloud } from 'react-icons/fa6';

/**
 * Returns the appropriate icon component based on the icon name
 * @param {string} iconName - The name of the icon to return
 * @returns {React.Component} The icon component
 */
export const getIcon = (iconName) => {
  const iconMap = {
    FaComputer: FaComputer,
    FaBook: FaBook,
    FaCode: FaCode,
    FaDatabase: FaDatabase,
    FaNetworkWired: FaNetworkWired,
    FaMobile: FaMobile,
    FaServer: FaServer,
    FaCloud: FaCloud,
  };

  // Return the requested icon or FaBook as default
  return iconMap[iconName] || FaBook;
}; 