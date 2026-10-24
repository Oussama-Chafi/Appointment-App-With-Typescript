import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets_frontend/assets";

const Contact = () => {
  const navigate = useNavigate();
  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white">
      <h2 className="text-center text-2xl tracking-wide md:text-3xl lg:text-4xl">
        <span className="text-slate-500 dark:text-slate-400">CONTACT </span>
        <span className="font-bold">US</span>
      </h2>

      <div className="mt-8 flex flex-col items-center gap-8 md:mt-14 md:flex-row md:gap-10 lg:gap-16">
        <img
          src={assets.contact_image}
          alt="Contact Us"
          className="w-full max-w-md rounded-xl object-cover md:w-1/2 md:max-w-none lg:w-5/18"
        />

        <div className="w-full space-y-8 md:w-1/2 lg:w-7/12">
          {/* Office */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold tracking-wide md:text-xl">
              OUR OFFICE
            </h3>
            <address className="space-y-1 text-sm not-italic leading-relaxed text-slate-600 md:text-base dark:text-slate-300">
              <p>54709 Willms Station Suite 350, Washington, USA</p>
              <p className="pt-3">
                Tel:{" "}
                <a
                  href="tel:4114320132"
                  className="underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  (411) 432-0132
                </a>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:AppointmentApp@gmail.com"
                  className="break-all underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  AppointmentApp@gmail.com
                </a>
              </p>
            </address>
          </div>

          {/* Careers */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold tracking-wide md:text-xl">
              Careers at PRESCRIPTO
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base dark:text-slate-300">
              Learn more about our teams and job openings.
            </p>
            <button
              type="button"
              className="mt-2 cursor-pointer rounded-lg border-2 border-slate-900 px-8 py-3 text-sm font-semibold transition-colors duration-300 hover:border-transparent hover:bg-(--primary-color) hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-white dark:focus-visible:ring-offset-slate-900"
              onClick={() => navigate("/app-to-be-doctor")}
            >
              Explore Jobs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
