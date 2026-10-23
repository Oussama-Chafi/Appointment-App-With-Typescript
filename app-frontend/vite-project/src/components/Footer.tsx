import { assets } from "../assets/assets_frontend/assets";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-slate-700 md:mt-24 dark:border-slate-800 dark:bg-black dark:text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[3fr_1fr_1fr] md:gap-12 md:py-16 lg:px-8">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <img className="w-40 md:w-44" src={assets.logo} alt="Logo" />
          <p className="max-w-xl text-sm leading-relaxed md:text-base">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </p>
        </div>

        {/* Company */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 md:text-xl dark:text-white">
            COMPANY
          </h3>
          <ul className="space-y-2 text-sm md:text-base">
            <li>Home</li>
            <li>About us</li>
            <li>Contact us</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 md:text-xl dark:text-white">
            GET IN TOUCH
          </h3>
          <ul className="space-y-2 text-sm md:text-base">
            <li>
              <span className="font-bold">Phone:</span> +2-23-232-32-44-3
            </li>
            <li className="break-all">
              <span className="font-bold">Gmail:</span> appointment@gmail.com
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
