import Banner from "../components/Banner";
import Hero from "../components/Hero";
import ToopDoctors from "../components/ToopDoctors";
import TopSpecialties from "../components/TopSpecialties";

const Header = () => {
  return (
    <div className="bg-white dark:bg-black h-full w-full">
      <Hero />
      <TopSpecialties />
      <ToopDoctors />
      <Banner />
    </div>
  );
};

export default Header;
