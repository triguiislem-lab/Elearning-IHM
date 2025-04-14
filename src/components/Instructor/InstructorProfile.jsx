import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { MdSchool, MdEmail, MdPerson, MdInfo, MdStar } from 'react-icons/md';
import ContactForm from '../Contact/ContactForm';

const InstructorProfile = ({ instructorId, courseId, courseName }) => {
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [courses, setCourses] = useState([]);

  const database = getDatabase();

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!instructorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Récupérer les informations du formateur
        const instructorRef = ref(database, `Elearning/Formateurs/${instructorId}`);
        const instructorSnapshot = await get(instructorRef);

        if (instructorSnapshot.exists()) {
          const instructorData = instructorSnapshot.val();
          
          // Récupérer les informations utilisateur supplémentaires si nécessaire
          const userRef = ref(database, `Elearning/Utilisateurs/${instructorId}`);
          const userSnapshot = await get(userRef);
          
          let userData = {};
          if (userSnapshot.exists()) {
            userData = userSnapshot.val();
          }
          
          // Fusionner les données
          const mergedData = {
            ...instructorData,
            prenom: userData.prenom || instructorData.prenom || '',
            nom: userData.nom || instructorData.nom || '',
            email: userData.email || instructorData.email || '',
            id: instructorId
          };
          
          setInstructor(mergedData);
          
          // Récupérer les cours du formateur
          if (instructorData.formations) {
            const coursesPromises = Object.keys(instructorData.formations).map(async (formationId) => {
              const formationRef = ref(database, `Elearning/Formations/${formationId}`);
              const formationSnapshot = await get(formationRef);
              
              if (formationSnapshot.exists()) {
                return formationSnapshot.val();
              }
              return null;
            });
            
            const formationsData = await Promise.all(coursesPromises);
            setCourses(formationsData.filter(Boolean));
          } else {
            // Rechercher les cours où ce formateur est assigné
            const coursesRef = ref(database, 'Elearning/Cours');
            const coursesSnapshot = await get(coursesRef);
            
            if (coursesSnapshot.exists()) {
              const allCourses = coursesSnapshot.val();
              const instructorCourses = Object.values(allCourses).filter(
                course => course.formateur === instructorId || course.instructorId === instructorId
              );
              
              setCourses(instructorCourses);
            }
          }
        } else {
          setError('Formateur non trouvé');
        }
      } catch (error) {
        
        setError('Erreur lors de la récupération des informations du formateur');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [instructorId, database]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <span className="ml-2 text-gray-600">Chargement des informations du formateur...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
          Informations du formateur non disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <MdSchool className="mr-2 text-secondary" />
        Profil du formateur
      </h2>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Photo et informations de base */}
        <div className="md:w-1/3">
          <div className="flex flex-col items-center">
            <img
              src={instructor.avatar || 'https://via.placeholder.com/150'}
              alt={`${instructor.prenom} ${instructor.nom}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-secondary mb-4"
            />
            <h3 className="text-lg font-semibold">
              {instructor.prenom} {instructor.nom}
            </h3>
            <p className="text-gray-600 mb-2">{instructor.specialite || 'Formateur'}</p>
            
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300"
            >
              <MdEmail />
              Contacter le formateur
            </button>
          </div>
        </div>
        
        {/* Biographie et détails */}
        <div className="md:w-2/3">
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2 flex items-center">
              <MdInfo className="mr-2 text-gray-600" />
              Biographie
            </h4>
            <p className="text-gray-700">
              {instructor.bio || "Aucune biographie disponible pour ce formateur."}
            </p>
          </div>
          
          {courses.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 flex items-center">
                <MdSchool className="mr-2 text-gray-600" />
                Cours enseignés
              </h4>
              <ul className="space-y-2">
                {courses.slice(0, 3).map((course, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                    <span>{course.titre || course.title}</span>
                    {course.rating && (
                      <div className="ml-2 flex items-center text-yellow-500">
                        <MdStar />
                        <span className="text-sm">{course.rating}</span>
                      </div>
                    )}
                  </li>
                ))}
                {courses.length > 3 && (
                  <li className="text-secondary text-sm">
                    +{courses.length - 3} autres cours
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Formulaire de contact */}
      {showContactForm && (
        <div className="mt-6 border-t pt-6">
          <ContactForm
            recipientId={instructorId}
            recipientType="instructor"
            recipientName={`${instructor.prenom} ${instructor.nom}`}
            courseId={courseId}
            courseName={courseName}
          />
        </div>
      )}
    </div>
  );
};

export default InstructorProfile;
