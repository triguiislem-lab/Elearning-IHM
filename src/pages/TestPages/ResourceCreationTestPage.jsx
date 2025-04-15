import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../../firebaseConfig';
import { ref, get } from 'firebase/database';
import * as paths from '../../utils/firebasePaths';
import { addResourceToModule } from '../../utils/moduleResourceUtils';

const ResourceCreationTestPage = () => {
  const { courseId, moduleId } = useParams();
  const [customCourseId, setCustomCourseId] = useState(courseId || '');
  const [customModuleId, setCustomModuleId] = useState(moduleId || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [moduleData, setModuleData] = useState(null);
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    type: 'video',
    url: ''
  });

  useEffect(() => {
    if (courseId && moduleId) {
      fetchData();
    }
  }, [courseId, moduleId]);

  const fetchData = async () => {
    if (!courseId || !moduleId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch course data
      const courseRef = ref(database, paths.COURSE_PATH(courseId));
      const courseSnapshot = await get(courseRef);
      
      if (courseSnapshot.exists()) {
        const data = courseSnapshot.val();
        setCourseData(data);
        
        // Find the module
        if (data.modules) {
          let foundModule = null;
          
          if (Array.isArray(data.modules)) {
            foundModule = data.modules.find(m => m.id === moduleId);
          } else if (typeof data.modules === 'object') {
            foundModule = data.modules[moduleId];
          }
          
          if (foundModule) {
            setModuleData(foundModule);
          } else {
            setError('Module not found in course data');
          }
        } else {
          setError('No modules found in course data');
        }
      } else {
        // Try alternative paths
        const alternativePaths = [
          `elearning/courses/${courseId}`,
          `Elearning/Cours/${courseId}`
        ];
        
        let found = false;
        for (const path of alternativePaths) {
          const altRef = ref(database, path);
          const altSnapshot = await get(altRef);
          if (altSnapshot.exists()) {
            const data = altSnapshot.val();
            setCourseData(data);
            
            // Find the module
            if (data.modules) {
              let foundModule = null;
              
              if (Array.isArray(data.modules)) {
                foundModule = data.modules.find(m => m.id === moduleId);
              } else if (typeof data.modules === 'object') {
                foundModule = data.modules[moduleId];
              }
              
              if (foundModule) {
                setModuleData(foundModule);
                found = true;
                break;
              }
            }
          }
        }
        
        if (!found) {
          setError('Course not found');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/test/resource-creation/${customCourseId}/${customModuleId}`);
  };
  
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!courseId || !moduleId) {
        throw new Error('Course ID and Module ID are required');
      }
      
      if (!resourceData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (resourceData.type === 'video' && !resourceData.url.trim()) {
        throw new Error('URL is required for video resources');
      }
      
      // Add resource to module
      const newResource = await addResourceToModule(courseId, moduleId, resourceData);
      
      setSuccess(`Resource "${newResource.title}" added successfully!`);
      
      // Reset form
      setResourceData({
        title: '',
        description: '',
        type: 'video',
        url: ''
      });
    } catch (err) {
      console.error('Error adding resource:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
        <p>You must be logged in to use this test page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Resource Creation Test Page</h1>
      
      <div className="mb-8 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Different Course/Module</h2>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Course ID</label>
            <input
              type="text"
              value={customCourseId}
              onChange={(e) => setCustomCourseId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter course ID"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Module ID</label>
            <input
              type="text"
              value={customModuleId}
              onChange={(e) => setCustomModuleId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter module ID"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test
            </button>
          </div>
        </form>
      </div>
      
      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-700">Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      {courseId && moduleId ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Add Resource to Module</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium">Course & Module Info</h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Course ID:</strong> {courseId}</p>
              <p><strong>Course Title:</strong> {courseData?.title || 'Not found'}</p>
              <p><strong>Module ID:</strong> {moduleId}</p>
              <p><strong>Module Title:</strong> {moduleData?.title || 'Not found'}</p>
            </div>
          </div>
          
          <form onSubmit={handleResourceSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Resource Title</label>
              <input
                type="text"
                value={resourceData.title}
                onChange={(e) => setResourceData({...resourceData, title: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter resource title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Resource Type</label>
              <select
                value={resourceData.type}
                onChange={(e) => setResourceData({...resourceData, type: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="link">Link</option>
                <option value="document">Document</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Resource URL</label>
              <input
                type="text"
                value={resourceData.url}
                onChange={(e) => setResourceData({...resourceData, url: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter resource URL"
                required={resourceData.type === 'video' || resourceData.type === 'link'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={resourceData.description}
                onChange={(e) => setResourceData({...resourceData, description: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter resource description"
                rows="3"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Resource'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p>Enter a course ID and module ID to test resource creation.</p>
          <p className="mt-2 text-sm text-gray-600">
            Recommended test: Use the course ID and module ID from the "developpement dotnet" course
            which is known to work correctly.
          </p>
        </div>
      )}
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How This Test Works</h2>
        <p className="mb-2">
          This test page allows you to add resources to a module using the same utility functions
          that the application uses. It helps identify if there are issues with how resources are
          stored in Firebase.
        </p>
        <p>
          If you can successfully add resources here but not in the main application, there may be
          an issue with how the courseId is being passed to the ModuleManagerCreation component.
        </p>
      </div>
    </div>
  );
};

export default ResourceCreationTestPage;
