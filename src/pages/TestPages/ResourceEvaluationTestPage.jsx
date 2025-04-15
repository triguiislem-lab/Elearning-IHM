import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../../firebaseConfig';
import { ref, get } from 'firebase/database';
import * as paths from '../../utils/firebasePaths';

const ResourceEvaluationTestPage = () => {
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
  const [evaluations, setEvaluations] = useState([]);

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
            
            // Get evaluations
            if (foundModule.evaluations) {
              if (Array.isArray(foundModule.evaluations)) {
                setEvaluations(foundModule.evaluations);
              } else {
                setEvaluations(Object.values(foundModule.evaluations));
              }
            }
          } else {
            setError('Module not found in course data');
          }
        } else {
          setError('No modules found in course data');
        }
      } else {
        // Try alternative paths
        const alternativePaths = [
          `elearning/modules/${courseId}/${moduleId}`,
          `Elearning/Cours/${courseId}/modules/${moduleId}`,
          `Elearning/Modules/${courseId}/${moduleId}`
        ];
        
        let found = false;
        for (const path of alternativePaths) {
          const altRef = ref(database, path);
          const altSnapshot = await get(altRef);
          if (altSnapshot.exists()) {
            const data = altSnapshot.val();
            setModuleData(data);
            
            // Get evaluations
            if (data.evaluations) {
              if (Array.isArray(data.evaluations)) {
                setEvaluations(data.evaluations);
              } else {
                setEvaluations(Object.values(data.evaluations));
              }
            }
            
            found = true;
            break;
          }
        }
        
        if (!found) {
          setError('Course or module not found');
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
    navigate(`/test/resource-evaluation/${customCourseId}/${customModuleId}`);
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
      <h1 className="text-2xl font-bold mb-6">Resource & Evaluation Test Page</h1>
      
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
          <h2 className="text-xl font-semibold mb-4">Module Evaluations</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium">Course & Module Info</h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Course ID:</strong> {courseId}</p>
              <p><strong>Course Title:</strong> {courseData?.title || 'Not found'}</p>
              <p><strong>Module ID:</strong> {moduleId}</p>
              <p><strong>Module Title:</strong> {moduleData?.title || 'Not found'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium">Evaluations</h3>
            {evaluations.length > 0 ? (
              <div className="space-y-4 mt-2">
                {evaluations.map((evaluation, index) => (
                  <div key={index} className="border p-3 rounded-lg">
                    <h4 className="font-semibold">{evaluation.title}</h4>
                    <p className="text-sm text-gray-600">{evaluation.description}</p>
                    <div className="mt-2">
                      <p><strong>Type:</strong> {evaluation.type}</p>
                      <p><strong>Max Score:</strong> {evaluation.maxScore}</p>
                      <p><strong>Questions:</strong> {evaluation.questions ? evaluation.questions.length : 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-2">No evaluations found for this module.</p>
            )}
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium">Database Paths</h3>
            <div className="bg-gray-50 p-3 rounded-lg mt-2">
              <p><strong>Main Course Path:</strong> {paths.COURSE_PATH(courseId)}</p>
              <p><strong>Main Module Path:</strong> {paths.MODULE_PATH(courseId, moduleId)}</p>
              <p><strong>Legacy Course Path:</strong> {paths.LEGACY_COURSE_PATH(courseId)}</p>
              <p><strong>Legacy Module Path:</strong> {paths.LEGACY_MODULE_PATH(courseId, moduleId)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p>Enter a course ID and module ID to test evaluations.</p>
          <p className="mt-2 text-sm text-gray-600">
            Recommended test: Use the course ID and module ID from the "developpement dotnet" course
            which is known to work correctly.
          </p>
        </div>
      )}
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How This Test Works</h2>
        <p className="mb-2">
          This test page allows you to view evaluations for a module from different paths in the database.
          It helps identify if there are issues with how evaluations are stored or retrieved.
        </p>
        <p>
          If you can see evaluations here but not in the main application, there may be an issue with
          how the data is being displayed in the UI rather than with the data itself.
        </p>
      </div>
    </div>
  );
};

export default ResourceEvaluationTestPage;
