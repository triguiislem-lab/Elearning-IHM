// Utilitaire de mise en cache pour les requêtes Firebase
const cache = {
  data: {},
  timestamp: {},
  expirationTime: 5 * 60 * 1000, // 5 minutes en millisecondes
};

export const getCachedData = (key) => {
  const now = Date.now();
  if (
    cache.data[key] &&
    cache.timestamp[key] &&
    now - cache.timestamp[key] < cache.expirationTime
  ) {
    
    return cache.data[key];
  }
  return null;
};

export const setCachedData = (key, data) => {
  cache.data[key] = data;
  cache.timestamp[key] = Date.now();
  
};

export const clearCache = () => {
  cache.data = {};
  cache.timestamp = {};
  
};

export const clearCacheItem = (key) => {
  delete cache.data[key];
  delete cache.timestamp[key];
  
};
