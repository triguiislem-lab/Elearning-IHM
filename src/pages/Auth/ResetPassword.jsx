import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { MdArrowBack } from "react-icons/md";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      if (error.code === "auth/user-not-found") {
        setError("Aucun compte n'est associé à cette adresse email.");
      } else if (error.code === "auth/invalid-email") {
        setError("Format d'email invalide.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer plus tard.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-light py-14 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <div className="mb-6">
            <Link to="/login" className="text-link flex items-center gap-1">
              <MdArrowBack size={16} />
              Retour à la connexion
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold mb-6">Réinitialisation du mot de passe</h1>
          
          {success ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
              <p className="font-medium">Email envoyé !</p>
              <p className="mt-1">
                Un email de réinitialisation a été envoyé à {email}. Veuillez vérifier votre boîte de réception et suivre les instructions.
              </p>
              <div className="mt-4">
                <Link to="/login" className="secondary-btn">
                  Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-input"
                    placeholder="Entrez votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="secondary-btn w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Envoi en cours..." : "Réinitialiser le mot de passe"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
