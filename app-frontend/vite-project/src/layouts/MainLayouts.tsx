import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MainLayouts = () => {
  return (
    <div className="dark:bg-black">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};

export default MainLayouts;
