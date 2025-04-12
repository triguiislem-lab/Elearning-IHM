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
  tag: "CUSTOMIZE WITH YOUR SCHEDULE",
  title: "Personalized Professional Online Tutor on Your Schedule",
  subtitle:
    "Our scheduling system allows you to select based on your free time. Lorem ipsum demo text for template. Keep track of your students class and tutoring schedules, and never miss your lectures. The best online class scheduling system with easy accessibility.Lorem ipsum is a placeholder text commonly used to demonstrate the visual form",
  link: "#",
};

const BannerData2 = {
  image: Img2,
  tag: "CUSTOMIZE WITH YOUR SCHEDULE",
  title: "Talented and Qualified Tutors to Serve You for Help",
  subtitle:
    "Our scheduling system allows you to select based on your free time. Lorem ipsum demo text for template. Keep track of your students class and tutoring schedules, and never miss your lectures. The best online class scheduling system with easy accessibility. Lorem ipsum is a placeholder text commonly used",
  link: "#",
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
