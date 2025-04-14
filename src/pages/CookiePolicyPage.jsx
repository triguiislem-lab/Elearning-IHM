import React from 'react';

const CookiePolicyPage = () => {
  return (
    <div className="bg-light py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Politique de Cookies</h1>
          
          <div className="prose max-w-none text-gray-700">
            <p className="mb-4">
              Dernière mise à jour : 1 juin 2024
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
            <p className="mb-4">
              Un cookie est un petit fichier texte qui est stocké sur votre ordinateur ou appareil mobile lorsque vous visitez un site web. Les cookies sont largement utilisés pour faire fonctionner les sites web ou les faire fonctionner plus efficacement, ainsi que pour fournir des informations aux propriétaires du site.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Comment nous utilisons les cookies</h2>
            <p className="mb-4">
              Nous utilisons des cookies pour plusieurs raisons. Certains cookies sont nécessaires au fonctionnement technique de notre site web, tandis que d'autres nous permettent d'améliorer votre expérience en nous fournissant des informations sur la façon dont le site est utilisé. Voici les types de cookies que nous utilisons :
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Cookies essentiels</h3>
            <p className="mb-4">
              Ces cookies sont nécessaires au fonctionnement de notre site web. Ils vous permettent de naviguer sur notre site et d'utiliser ses fonctionnalités, comme l'accès aux zones sécurisées. Sans ces cookies, les services que vous avez demandés ne peuvent pas être fournis.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Cookies de performance</h3>
            <p className="mb-4">
              Ces cookies collectent des informations sur la façon dont les visiteurs utilisent notre site web, par exemple quelles pages ils visitent le plus souvent et s'ils reçoivent des messages d'erreur. Ces cookies ne collectent pas d'informations qui identifient un visiteur. Toutes les informations que ces cookies collectent sont agrégées et donc anonymes. Elles sont uniquement utilisées pour améliorer le fonctionnement de notre site web.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Cookies de fonctionnalité</h3>
            <p className="mb-4">
              Ces cookies permettent à notre site web de se souvenir des choix que vous faites (comme votre nom d'utilisateur, votre langue ou la région dans laquelle vous vous trouvez) et de fournir des fonctionnalités améliorées et plus personnelles. Ces cookies peuvent également être utilisés pour se souvenir des modifications que vous avez apportées à la taille du texte, aux polices et à d'autres parties des pages web que vous pouvez personnaliser.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Cookies de ciblage ou publicitaires</h3>
            <p className="mb-4">
              Ces cookies sont utilisés pour diffuser des publicités plus pertinentes pour vous et vos intérêts. Ils sont également utilisés pour limiter le nombre de fois que vous voyez une publicité ainsi que pour aider à mesurer l'efficacité des campagnes publicitaires. Ils sont généralement placés par des réseaux publicitaires avec notre permission. Ils se souviennent que vous avez visité un site web et cette information est partagée avec d'autres organisations telles que les annonceurs.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Comment gérer les cookies</h2>
            <p className="mb-4">
              Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez supprimer tous les cookies qui sont déjà sur votre ordinateur et vous pouvez configurer la plupart des navigateurs pour les empêcher d'être placés. Si vous le faites, vous devrez peut-être ajuster manuellement certaines préférences chaque fois que vous visitez un site, et certains services et fonctionnalités peuvent ne pas fonctionner.
            </p>
            
            <p className="mb-4">
              Pour plus d'informations sur la façon de gérer les cookies dans votre navigateur, veuillez consulter les liens suivants :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2"><a href="https://support.google.com/chrome/answer/95647?hl=fr" className="text-secondary hover:underline">Google Chrome</a></li>
              <li className="mb-2"><a href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur" className="text-secondary hover:underline">Mozilla Firefox</a></li>
              <li className="mb-2"><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" className="text-secondary hover:underline">Safari</a></li>
              <li className="mb-2"><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-secondary hover:underline">Microsoft Edge</a></li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Cookies tiers</h2>
            <p className="mb-4">
              En plus de nos propres cookies, nous pouvons également utiliser divers cookies tiers pour signaler les statistiques d'utilisation du site, diffuser des publicités, et ainsi de suite. Ces cookies peuvent inclure :
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Google Analytics</li>
              <li className="mb-2">Facebook Pixel</li>
              <li className="mb-2">LinkedIn Insight Tag</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Modifications de cette politique</h2>
            <p className="mb-4">
              Nous pouvons mettre à jour cette politique de cookies de temps à autre. Nous vous encourageons à consulter régulièrement cette page pour rester informé des changements.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Nous contacter</h2>
            <p className="mb-4">
              Si vous avez des questions concernant cette politique de cookies, veuillez nous contacter à :
            </p>
            <p className="mb-4">
              <strong>E-mail</strong> : cookies@e-learning.com<br />
              <strong>Adresse</strong> : 123 Avenue de l'Apprentissage, Tunis, 1002
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
