import React from "react";
import Hero from "../components/Hero/Hero";
import WhyChooseUs from "../components/WhyChooseUs/WhyChooseUs";
import SubjectCard from "../components/SubjectCard/SubjectCard";
import Banner from "../components/Banner/Banner";
import Testimonial from "../components/Testimonial/Testimonial";
import { Courses } from "../components/SubjectCard/Course";
import Img1 from "../assets/banner1.png";
import Img2 from "../assets/banner2.png";
import NumberCounter from "../components/NumberCounter/NumberCounter";

const BannerData = {
  image: Img1,
  tag: "APPRENEZ À VOTRE RYTHME",
  title: "Formation en ligne personnalisée selon votre emploi du temps",
  subtitle:
    "Notre plateforme vous permet d'accéder aux cours selon vos disponibilités. Suivez facilement votre progression et ne manquez jamais vos sessions d'apprentissage. Notre système de planification en ligne offre une accessibilité optimale pour tous les apprenants.",
  link: "/courses",
};

const BannerData2 = {
  image: Img2,
  tag: "DES EXPERTS À VOTRE SERVICE",
  title:
    "Des formateurs qualifiés pour vous accompagner dans votre apprentissage",
  subtitle:
    "Nos formateurs experts sont sélectionnés pour leur expertise et leur pédagogie. Ils vous accompagnent tout au long de votre parcours d'apprentissage avec des contenus de qualité et un suivi personnalisé pour garantir votre réussite.",
  link: "/courses",
};

const HomePage = () => {
  return (
    <>
      <Hero />
      <NumberCounter />

      {/* Section "Resources" */}
      <section id="resources" className="scroll-mt-24">
        <WhyChooseUs />
      </section>

      {/* Section "About Us" */}
      <section id="about" className="scroll-mt-24">
        <Banner {...BannerData} />
        <Banner {...BannerData2} reverse={true} />
      </section>

      <SubjectCard />
      <Courses />

      {/* Section "Contact Us" */}
      <section id="contact" className="scroll-mt-24">
        <Testimonial />
      </section>
    </>
  );
};

export default HomePage;
