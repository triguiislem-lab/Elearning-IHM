import React, { useState } from "react";
import {
  MdMessage,
  MdAdminPanelSettings,
  MdSchool,
  MdClose,
  MdHelpCenter,
} from "react-icons/md";
import ContactForm from "./ContactForm";

const ContactButtons = ({
  courseId,
  courseName,
  instructorId,
  instructorName,
}) => {
  const [showAdminContact, setShowAdminContact] = useState(false);
  const [showInstructorContact, setShowInstructorContact] = useState(false);

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <MdMessage className="mr-2 text-secondary" />
        Besoin d'aide ?
      </h2>

      <p className="text-gray-600 mb-4">
        Si vous avez des questions ou besoin d'assistance, n'hésitez pas à
        contacter notre équipe.
      </p>

      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => {
            setShowAdminContact(true);
            setShowInstructorContact(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          <MdAdminPanelSettings />
          Contacter l'administrateur
        </button>

        {instructorId && (
          <button
            onClick={() => {
              setShowInstructorContact(true);
              setShowAdminContact(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
          >
            <MdSchool />
            Contacter le formateur
          </button>
        )}

        <button
          onClick={() =>
            window.open("https://support.elearning.com/faq", "_blank")
          }
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors duration-300"
        >
          <MdHelpCenter />
          Consulter la FAQ
        </button>
      </div>

      {showAdminContact && (
        <div className="relative mb-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowAdminContact(false)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-300"
            >
              <MdClose />
            </button>
          </div>
          <ContactForm
            recipientId="admin" // ID générique pour l'administrateur
            recipientType="admin"
            recipientName="Administrateur"
            courseId={courseId}
            courseName={courseName}
          />
        </div>
      )}

      {showInstructorContact && instructorId && (
        <div className="relative mb-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowInstructorContact(false)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-300"
            >
              <MdClose />
            </button>
          </div>
          <ContactForm
            recipientId={instructorId}
            recipientType="instructor"
            recipientName={instructorName || "Formateur"}
            courseId={courseId}
            courseName={courseName}
          />
        </div>
      )}
    </div>
  );
};

export default ContactButtons;
