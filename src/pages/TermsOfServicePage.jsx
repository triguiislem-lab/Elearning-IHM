import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="bg-light py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Conditions d'Utilisation</h1>
          
          <div className="prose max-w-none text-gray-700">
            <p className="mb-4">
              Dernière mise à jour : 1 juin 2024
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptation des conditions</h2>
            <p className="mb-4">
              En accédant à ou en utilisant la plateforme E-Learning, vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Modifications des conditions</h2>
            <p className="mb-4">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur la plateforme. Votre utilisation continue de la plateforme après la publication des modifications constitue votre acceptation de ces modifications.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Accès à la plateforme</h2>
            <p className="mb-4">
              Nous nous efforçons de maintenir la plateforme disponible 24/7, mais nous ne garantissons pas que la plateforme sera disponible à tout moment. Nous nous réservons le droit de suspendre, de restreindre ou de limiter l'accès à la plateforme pour des raisons techniques, de sécurité, légales ou réglementaires.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Comptes utilisateurs</h2>
            <p className="mb-4">
              Pour accéder à certaines fonctionnalités de la plateforme, vous devrez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos informations de compte et de toutes les activités qui se produisent sous votre compte. Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Contenu de la plateforme</h2>
            <p className="mb-4">
              Le contenu de la plateforme, y compris les textes, graphiques, images, vidéos, et autres matériels, est protégé par les lois sur la propriété intellectuelle. Vous ne pouvez pas copier, reproduire, distribuer, transmettre, afficher, vendre, concéder sous licence, ou exploiter de quelque manière que ce soit tout contenu de la plateforme sans notre autorisation écrite préalable.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Contenu utilisateur</h2>
            <p className="mb-4">
              En soumettant du contenu à la plateforme, vous nous accordez une licence mondiale, non exclusive, libre de redevances, transférable et pouvant faire l'objet d'une sous-licence pour utiliser, reproduire, distribuer, préparer des œuvres dérivées, afficher et exécuter ce contenu en relation avec la plateforme et notre activité.
            </p>
            <p className="mb-4">
              Vous êtes seul responsable du contenu que vous soumettez à la plateforme. Vous ne devez pas soumettre de contenu qui :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Est illégal, diffamatoire, obscène, offensant, harcelant, ou autrement répréhensible</li>
              <li className="mb-2">Viole les droits de propriété intellectuelle d'un tiers</li>
              <li className="mb-2">Contient des virus, des chevaux de Troie, des vers, des bombes à retardement, des robots d'annulation, ou d'autres routines de programmation informatique qui visent à endommager, interférer avec, intercepter subrepticement, ou exproprier tout système, donnée ou information personnelle</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Paiements et remboursements</h2>
            <p className="mb-4">
              Certains cours et fonctionnalités de la plateforme peuvent nécessiter un paiement. Les prix sont indiqués sur la plateforme et peuvent être modifiés à tout moment. Les remboursements sont accordés conformément à notre politique de remboursement, disponible sur la plateforme.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitation de responsabilité</h2>
            <p className="mb-4">
              Dans toute la mesure permise par la loi, nous ne serons pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, ou de toute perte de profits ou de revenus, que ces dommages soient prévisibles ou non, et même si nous avons été informés de la possibilité de tels dommages.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Indemnisation</h2>
            <p className="mb-4">
              Vous acceptez de nous indemniser, de nous défendre et de nous tenir à l'écart de toute réclamation, responsabilité, dommage, perte et dépense, y compris, sans limitation, les frais juridiques et comptables raisonnables, découlant de ou liés de quelque manière que ce soit à votre accès à ou à votre utilisation de la plateforme, à votre violation de ces conditions, ou à votre violation des droits d'un tiers.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Loi applicable</h2>
            <p className="mb-4">
              Ces conditions sont régies par et interprétées conformément aux lois de la Tunisie, sans égard aux principes de conflits de lois.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">11. Nous contacter</h2>
            <p className="mb-4">
              Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à :
            </p>
            <p className="mb-4">
              <strong>E-mail</strong> : terms@e-learning.com<br />
              <strong>Adresse</strong> : 123 Avenue de l'Apprentissage, Tunis, 1002
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
