import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets_frontend/assets";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { RiCloseFill } from "@remixicon/react";

const Navbar = () => {
  const navs: { key: number; path: string; navName: string }[] = [
    { key: 1, path: "/", navName: "Home" },
    { key: 2, path: "/all-doctors", navName: "All Doctors" },
    { key: 3, path: "/about", navName: "About" },
    { key: 4, path: "/contact", navName: "Contact" },
  ];
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (theme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
  return (
    <header className="w-full bg-gray-200/50 dark:bg-(--nav-dark-bg-color) dark:text-white transition-colors duration-200">
      <div className="flex items-center justify-between py-4 mx-2 md:mx-5 lg:mx-15 border-b border-gray-400 dark:border-gray-800 pb-4 ">
        <img
          src={assets.logo}
          alt="Logo"
          className="w-39 h-10 md:w-40 md:h-10 object-contain"
        />
        <ul className=" max-md:hidden flex gap-8">
          {navs.map((element) => (
            <li
              key={element.key}
              className="font-bold p-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full duration-200  "
            >
              {<NavLink to={element.path}>{element.navName}</NavLink>}
            </li>
          ))}
        </ul>
        <div className="max-md:hidden flex items-center gap-2 lg:gap-4">
          <button
            onClick={() => setTheme(!theme)}
            aria-label="Toggel Theme"
            className="cursor-pointer p-1"
          >
            {theme ? (
              <Sun className="w-7 h-7 transition-transform duration-300 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-7 h-7 text-slate-700 transition-transform duration-300 rotate-12 hover:rotate-0" />
            )}
          </button>
          <a
            href="/register"
            className="bg-(--primary-color) rounded-full px-3 py-2 text-center text-white"
          >
            Create account
          </a>
        </div>
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen((p) => !p)}
            className="p-1 cursor-pointer text-gray-600 dark:text-white"
          >
            <Menu size={30} />
          </button>
        </div>
        <nav
          className={`w-full h-screen fixed top-0 left-0 flex flex-col bg-gray-50 dark:bg-black duration-200 transition-transform z-50 py-5  ${isOpen ? "translate-x-0" : "translate-x-full"} md:hidden`}
        >
          <div className="flex justify-between items-center mb-8 border-b border-gray-300 dark:border-gray-800 pb-4 mx-3">
            <img
              src={assets.logo}
              alt="Logo"
              className="w-32 h-10 object-contain"
            />
            <RiCloseFill
              className="text-gray-700 dark:text-white hover:opacity-75 cursor-pointer"
              size={32}
              onClick={() => setIsOpen(false)}
            />
          </div>
          <div className="flex items-center justify-between mx-2 mb-4 font-semibold ">
            <p className="text-lg p-1">Theme</p>
            <button
              onClick={() => setTheme((p) => !p)}
              className="cursor-pointer p-1"
            >
              {theme ? (
                <Sun className="w-7 h-7 " />
              ) : (
                <Moon className="w-7 h-7 " />
              )}
            </button>
          </div>
          <ul className="flex flex-col gap-3 text-lg font-medium ">
            {navs.map((element) => (
              <li
                key={element.key}
                onClick={() => setIsOpen(false)}
                className="w-full font-bold pl-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 cursor-pointer"
              >
                {<NavLink to={element.path}>{element.navName}</NavLink>}
              </li>
            ))}
          </ul>
          <div className="mt-auto pb-10 flex justify-center ">
            <a
              onClick={() => setIsOpen(false)}
              href="/register"
              className="bg-(--primary-color) block text-center rounded-full px-5 py-3 text-white font-medium cursor-pointer max-md:w-[60%]"
            >
              Create account
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
