import React from 'react';
import { MdSchool, MdPeople, MdAccessTime, MdDevices } from 'react-icons/md';

const AboutPage = () => {
  return (
    <div className="bg-light py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">À Propos de E-Learning</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Notre mission est de fournir une éducation de qualité accessible à tous, partout et à tout moment.
          </p>
        </div>

        {/* Our Story Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Notre Histoire</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-4">
                Fondée en 2020, E-Learning est née de la conviction que l'éducation de qualité devrait être accessible à tous. Notre fondateur, ayant lui-même rencontré des obstacles dans son parcours éducatif, a décidé de créer une plateforme qui éliminerait ces barrières.
              </p>
              <p className="text-gray-600 mb-4">
                Nous avons commencé avec une petite équipe passionnée et quelques cours en ligne. Aujourd'hui, nous sommes fiers de proposer des centaines de cours dans diverses disciplines, enseignés par des experts reconnus dans leurs domaines.
              </p>
              <p className="text-gray-600">
                Notre engagement envers l'excellence pédagogique et l'innovation technologique nous a permis de devenir l'une des plateformes d'apprentissage en ligne les plus respectées.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Notre équipe" 
                className="rounded-lg shadow-md max-h-80 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <MdSchool className="text-5xl text-secondary mx-auto mb-4" />
            <h3 className="text-4xl font-bold text-gray-800 mb-2">500+</h3>
            <p className="text-gray-600">Cours Disponibles</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <MdPeople className="text-5xl text-secondary mx-auto mb-4" />
            <h3 className="text-4xl font-bold text-gray-800 mb-2">50,000+</h3>
            <p className="text-gray-600">Étudiants Actifs</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <MdAccessTime className="text-5xl text-secondary mx-auto mb-4" />
            <h3 className="text-4xl font-bold text-gray-800 mb-2">24/7</h3>
            <p className="text-gray-600">Support Disponible</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <MdDevices className="text-5xl text-secondary mx-auto mb-4" />
            <h3 className="text-4xl font-bold text-gray-800 mb-2">100%</h3>
            <p className="text-gray-600">Compatible Mobile</p>
          </div>
        </div>

        {/* Our Values Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Nos Valeurs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-secondary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Excellence</h3>
              <p className="text-gray-600">
                Nous nous engageons à offrir des contenus éducatifs de la plus haute qualité, créés par des experts dans leur domaine.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-secondary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Accessibilité</h3>
              <p className="text-gray-600">
                Nous croyons que l'éducation devrait être accessible à tous, indépendamment de leur situation géographique ou financière.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-secondary">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Innovation</h3>
              <p className="text-gray-600">
                Nous exploitons les dernières technologies pour créer des expériences d'apprentissage engageantes et efficaces.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-secondary text-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer votre parcours d'apprentissage?</h2>
          <p className="text-xl mb-6">
            Rejoignez notre communauté d'apprenants dès aujourd'hui et transformez votre avenir.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/courses" className="bg-white text-secondary font-bold py-3 px-6 rounded-md hover:bg-gray-100 transition-colors">
              Explorer les Cours
            </a>
            <a href="/register" className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-md hover:bg-white/10 transition-colors">
              S'inscrire Maintenant
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
