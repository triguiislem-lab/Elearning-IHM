// This file contains fixes for the ModuleContent component to ensure resources and evaluations
// added by instructors are visible to all enrolled students

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, get, update } from "firebase/database";

// Improved resource normalization function
const normalizeResources = (moduleData) => {
  if (!moduleData) return [];

  // If resources is already an array, use it
  if (Array.isArray(moduleData.resources)) {
    return moduleData.resources.map(resource => ({
      ...resource,
      id: resource.id || `resource_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title: resource.title || 'Ressource sans titre',
      type: resource.type || 'document',
      description: resource.description || `Ressource de type ${resource.type || 'document'}`
    }));
  }

  // If resources is an object, convert it to an array
  if (typeof moduleData.resources === 'object' && moduleData.resources !== null) {
    return Object.entries(moduleData.resources)
      .filter(([_, resource]) => typeof resource === 'object') // Filter out boolean values
      .map(([id, resource]) => ({
        id: id,
        title: resource.title || `Ressource ${id}`,
        type: resource.type || 'document',
        description: resource.description || `Ressource de type ${resource.type || 'document'}`,
        url: resource.url || '',
        ...resource
      }));
  }

  return [];
};

// Improved evaluation normalization function
const normalizeEvaluations = (moduleData) => {
  if (!moduleData) return [];

  // If evaluations is already an array, use it
  if (Array.isArray(moduleData.evaluations)) {
    return moduleData.evaluations.map(evaluation => ({
      ...evaluation,
      id: evaluation.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title: evaluation.title || 'Évaluation sans titre',
      type: evaluation.type || 'quiz',
      description: evaluation.description || `Évaluation de type ${evaluation.type || 'quiz'}`
    }));
  }

  // If evaluations is an object, convert it to an array
  if (typeof moduleData.evaluations === 'object' && moduleData.evaluations !== null) {
    return Object.entries(moduleData.evaluations)
      .filter(([_, evaluation]) => typeof evaluation === 'object') // Filter out boolean values
      .map(([id, evaluation]) => ({
        id: id,
        title: evaluation.title || `Évaluation ${id}`,
        type: evaluation.type || 'quiz',
        description: evaluation.description || `Évaluation de type ${evaluation.type || 'quiz'}`,
        questions: evaluation.questions || [],
        ...evaluation
      }));
  }

  return [];
};

// Enhanced ModuleContent component
const ModuleContentEnhanced = ({ module, isEnrolled = true, courseId, onComplete }) => {
  const { user, userRole } = useAuth();
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' or 'evaluations'
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

  // Fetch the latest module data directly from the database
  useEffect(() => {
    const fetchModuleData = async () => {
      if (!module || !module.id || !courseId) {
        setError("Module data is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try multiple paths to find the module
        const moduleId = module.id;
        
        // Path 1: Direct module path
        const modulePath = `elearning/courses/${courseId}/modules/${moduleId}`;
        const moduleRef = ref(database, modulePath);
        const snapshot = await get(moduleRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          setModuleData({
            ...data,
            id: moduleId,
            courseId: courseId,
          });
          setLoading(false);
          return;
        }

        // Path 2: Check if module is in the course object
        const coursePath = `elearning/courses/${courseId}`;
        const courseRef = ref(database, coursePath);
        const courseSnapshot = await get(courseRef);

        if (courseSnapshot.exists()) {
          const courseData = courseSnapshot.val();
          
          if (courseData.modules) {
            // If modules is an array
            if (Array.isArray(courseData.modules)) {
              const foundModule = courseData.modules.find(m => m.id === moduleId);
              if (foundModule) {
                setModuleData({
                  ...foundModule,
                  courseId: courseId,
                });
                setLoading(false);
                return;
              }
            }
            // If modules is an object
            else if (typeof courseData.modules === 'object') {
              if (courseData.modules[moduleId]) {
                setModuleData({
                  ...courseData.modules[moduleId],
                  id: moduleId,
                  courseId: courseId,
                });
                setLoading(false);
                return;
              }
            }
          }
        }

        // If we get here, module was not found
        setError(`Module not found (ID: ${moduleId})`);
      } catch (err) {
        console.error("Error fetching module data:", err);
        setError("Error loading module data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [module, courseId, refreshKey]); // Include refreshKey to allow forced refresh

  // Force refresh the module data
  const refreshModuleData = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Get normalized resources and evaluations
  const resources = useMemo(() => {
    return normalizeResources(moduleData);
  }, [moduleData]);

  const evaluations = useMemo(() => {
    return normalizeEvaluations(moduleData);
  }, [moduleData]);

  // Check if there are resources and evaluations
  const hasResources = resources.length > 0;
  const hasEvaluations = evaluations.length > 0;

  if (loading) {
    return <div className="animate-pulse p-4">Loading module content...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={refreshModuleData}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        <p>No module data available.</p>
        <button 
          onClick={refreshModuleData}
          className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  // If there are no resources or evaluations, show a message
  if (!hasResources && !hasEvaluations) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
        <p>This module has no resources or evaluations yet.</p>
        <button 
          onClick={refreshModuleData}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'resources'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('resources')}
        >
          Resources ({resources.length})
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'evaluations'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('evaluations')}
        >
          Evaluations ({evaluations.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'resources' && (
          <div>
            {hasResources ? (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No resources available for this module.
              </p>
            )}
          </div>
        )}

        {activeTab === 'evaluations' && (
          <div>
            {hasEvaluations ? (
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <EvaluationItem 
                    key={evaluation.id} 
                    evaluation={evaluation} 
                    moduleId={moduleData.id}
                    courseId={courseId}
                    onComplete={onComplete}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No evaluations available for this module.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Resource item component
const ResourceItem = ({ resource }) => {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'document':
        return '📄';
      case 'link':
        return '🔗';
      case 'pdf':
        return '📑';
      default:
        return '📁';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start">
        <div className="text-2xl mr-3">{getResourceIcon(resource.type)}</div>
        <div className="flex-1">
          <h3 className="font-medium text-lg">{resource.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
          
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors"
            >
              {resource.type === 'video' ? 'Watch Video' : 
               resource.type === 'pdf' ? 'View PDF' : 
               'Open Resource'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Evaluation item component
const EvaluationItem = ({ evaluation, moduleId, courseId, onComplete }) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  
  const handleStartEvaluation = () => {
    setStarted(true);
  };
  
  const handleCompleteEvaluation = async (score) => {
    if (!user || !moduleId || !courseId || !evaluation.id) return;
    
    try {
      // Update user progress
      const progressRef = ref(database, `elearning/userProgress/${user.uid}/courses/${courseId}/modules/${moduleId}`);
      await update(progressRef, {
        completed: true,
        score: score,
        lastUpdated: new Date().toISOString()
      });
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(moduleId, score);
      }
      
      setStarted(false);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };
  
  if (started) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-lg mb-4">{evaluation.title}</h3>
        
        {/* Simplified evaluation content - in a real app, this would be more complex */}
        <div className="mb-4">
          <p>{evaluation.description}</p>
          
          {evaluation.type === 'quiz' && evaluation.questions && (
            <div className="mt-4 space-y-4">
              <p className="font-medium">This quiz has {evaluation.questions.length} questions.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setStarted(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={() => handleCompleteEvaluation(85)} // Simplified - would normally calculate actual score
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Complete Evaluation
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-medium text-lg">{evaluation.title}</h3>
      <p className="text-gray-600 text-sm mb-3">{evaluation.description}</p>
      
      <button
        onClick={handleStartEvaluation}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        Start {evaluation.type === 'quiz' ? 'Quiz' : 'Evaluation'}
      </button>
    </div>
  );
};

export default ModuleContentEnhanced;
