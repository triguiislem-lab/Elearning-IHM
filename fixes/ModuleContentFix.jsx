// This file contains the fixes needed for the ModuleContent.jsx component

// 1. Improved normalization of resources and evaluations
const normalizeResources = (moduleData) => {
  if (!moduleData || !moduleData.resources) return [];

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
  if (typeof moduleData.resources === 'object') {
    return Object.entries(moduleData.resources).map(([id, resource]) => {
      // Handle case where resource is just a boolean (true)
      if (typeof resource === 'boolean') {
        return { 
          id, 
          title: `Ressource ${id}`, 
          type: 'document',
          description: 'Ressource'
        };
      }
      return {
        id: id,
        title: resource.title || `Ressource ${id}`,
        type: resource.type || 'document',
        description: resource.description || `Ressource de type ${resource.type || 'document'}`,
        url: resource.url || '',
        ...resource
      };
    });
  }

  return [];
};

const normalizeEvaluations = (moduleData) => {
  if (!moduleData || !moduleData.evaluations) return [];

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
  if (typeof moduleData.evaluations === 'object') {
    return Object.entries(moduleData.evaluations).map(([id, evaluation]) => {
      // Handle case where evaluation is just a boolean (true)
      if (typeof evaluation === 'boolean') {
        return { 
          id, 
          title: `Évaluation ${id}`, 
          type: 'quiz',
          description: 'Évaluation'
        };
      }
      return {
        id: id,
        title: evaluation.title || `Évaluation ${id}`,
        type: evaluation.type || 'quiz',
        description: evaluation.description || `Évaluation de type ${evaluation.type || 'quiz'}`,
        questions: evaluation.questions || [],
        ...evaluation
      };
    });
  }

  return [];
};

// 2. Improved module data validation
const validateModuleData = (moduleData) => {
  if (!moduleData) {
    console.error('Module data is missing');
    return false;
  }

  // Check if module has basic required properties
  if (!moduleData.id) {
    console.error('Module ID is missing');
    return false;
  }

  // Ensure resources is properly structured
  if (moduleData.resources) {
    if (typeof moduleData.resources === 'object' && !Array.isArray(moduleData.resources)) {
      // Convert object to array
      moduleData.resources = Object.entries(moduleData.resources).map(([id, resource]) => {
        if (typeof resource === 'boolean') {
          return { id, title: `Resource ${id}`, type: 'document' };
        }
        return { id, ...resource };
      });
    } else if (!Array.isArray(moduleData.resources)) {
      // If not an object or array, initialize as empty array
      moduleData.resources = [];
    }
  } else {
    moduleData.resources = [];
  }

  // Ensure evaluations is properly structured
  if (moduleData.evaluations) {
    if (Array.isArray(moduleData.evaluations)) {
      // Convert array to object
      const evaluationsObj = {};
      moduleData.evaluations.forEach(eval => {
        if (eval.id) {
          evaluationsObj[eval.id] = eval;
        }
      });
      moduleData.evaluations = evaluationsObj;
    } else if (typeof moduleData.evaluations !== 'object') {
      // If not an object, initialize as empty object
      moduleData.evaluations = {};
    }
  } else {
    moduleData.evaluations = {};
  }

  return true;
};

// 3. Improved module content component
// This is a simplified version of what should be in the ModuleContent component
const ModuleContent = ({ module, isEnrolled = true, courseId, onComplete }) => {
  // Validate and normalize module data
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'evaluations'
  
  useEffect(() => {
    if (!module) {
      setError('Module data is missing');
      setLoading(false);
      return;
    }
    
    // Create a copy to avoid modifying the original
    const normalizedModule = { ...module };
    
    // Validate and fix module structure
    if (!validateModuleData(normalizedModule)) {
      setError('Invalid module data structure');
      setLoading(false);
      return;
    }
    
    setModuleData(normalizedModule);
    setLoading(false);
  }, [module]);
  
  // Get normalized resources and evaluations
  const normalizedResources = useMemo(() => {
    if (!moduleData) return [];
    return normalizeResources(moduleData);
  }, [moduleData]);
  
  const normalizedEvaluations = useMemo(() => {
    if (!moduleData) return [];
    return normalizeEvaluations(moduleData);
  }, [moduleData]);
  
  const hasResources = normalizedResources.length > 0;
  const hasEvaluations = normalizedEvaluations.length > 0;
  
  // Rest of the component...
};
