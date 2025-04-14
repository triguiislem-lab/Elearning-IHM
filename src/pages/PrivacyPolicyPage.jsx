import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-light py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Politique de Confidentialité</h1>
          
          <div className="prose max-w-none text-gray-700">
            <p className="mb-4">
              Dernière mise à jour : 1 juin 2024
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Bienvenue sur la plateforme E-Learning. Nous nous engageons à protéger votre vie privée et à traiter vos données personnelles avec transparence. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations lorsque vous utilisez notre site web et nos services.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Informations que nous collectons</h2>
            <p className="mb-4">
              Nous collectons les types d'informations suivants :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                <strong>Informations personnelles</strong> : nom, prénom, adresse e-mail, numéro de téléphone, et autres informations que vous nous fournissez lors de votre inscription.
              </li>
              <li className="mb-2">
                <strong>Informations de profil</strong> : photo de profil, biographie, préférences d'apprentissage, et autres informations que vous ajoutez à votre profil.
              </li>
              <li className="mb-2">
                <strong>Informations d'utilisation</strong> : données sur la façon dont vous interagissez avec notre plateforme, les cours que vous suivez, votre progression, et vos résultats.
              </li>
              <li className="mb-2">
                <strong>Informations techniques</strong> : adresse IP, type de navigateur, appareil utilisé, temps passé sur le site, pages visitées, et autres données de diagnostic.
              </li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Comment nous utilisons vos informations</h2>
            <p className="mb-4">
              Nous utilisons vos informations pour :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Fournir, maintenir et améliorer notre plateforme et nos services</li>
              <li className="mb-2">Personnaliser votre expérience d'apprentissage</li>
              <li className="mb-2">Communiquer avec vous concernant votre compte, vos cours, et nos services</li>
              <li className="mb-2">Vous envoyer des mises à jour, des newsletters, et des offres promotionnelles (si vous y avez consenti)</li>
              <li className="mb-2">Analyser l'utilisation de notre plateforme pour améliorer nos services</li>
              <li className="mb-2">Détecter, prévenir et résoudre les problèmes techniques et de sécurité</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Partage de vos informations</h2>
            <p className="mb-4">
              Nous ne vendons pas vos données personnelles. Nous pouvons partager vos informations dans les circonstances suivantes :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Avec les instructeurs des cours auxquels vous êtes inscrit</li>
              <li className="mb-2">Avec nos fournisseurs de services qui nous aident à exploiter notre plateforme</li>
              <li className="mb-2">Pour se conformer à la loi, à une procédure judiciaire, ou à une demande gouvernementale</li>
              <li className="mb-2">Pour protéger nos droits, notre propriété, ou notre sécurité, ainsi que ceux de nos utilisateurs</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Vos droits</h2>
            <p className="mb-4">
              Selon votre lieu de résidence, vous pouvez avoir certains droits concernant vos données personnelles, notamment :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Le droit d'accéder à vos données personnelles</li>
              <li className="mb-2">Le droit de rectifier vos données personnelles</li>
              <li className="mb-2">Le droit de supprimer vos données personnelles</li>
              <li className="mb-2">Le droit de restreindre le traitement de vos données personnelles</li>
              <li className="mb-2">Le droit à la portabilité des données</li>
              <li className="mb-2">Le droit de vous opposer au traitement de vos données personnelles</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Sécurité des données</h2>
            <p className="mb-4">
              Nous prenons la sécurité de vos données très au sérieux et mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre la perte, l'accès non autorisé, la divulgation, l'altération et la destruction.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Modifications de cette politique</h2>
            <p className="mb-4">
              Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement important en publiant la nouvelle politique de confidentialité sur cette page et en vous envoyant un e-mail.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Nous contacter</h2>
            <p className="mb-4">
              Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à :
            </p>
            <p className="mb-4">
              <strong>E-mail</strong> : privacy@e-learning.com<br />
              <strong>Adresse</strong> : 123 Avenue de l'Apprentissage, Tunis, 1002
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
