import { assets } from "../assets/assets_frontend/assets";

const Hero = () => {
  return (
    <section className="mx-2 my-2 flex flex-col items-center overflow-hidden rounded-lg bg-(--primary-color) dark:bg-(--header-dark-bg-color) md:mx-8 lg:mx-15 md:my-8 md:flex-row md:justify-between">
      <div className="flex w-full flex-col items-center gap-5 px-6 pt-10 text-center md:w-1/2 md:items-start md:px-10 md:py-12 md:text-left lg:px-16 lg:py-[8vw] xl:py-24">
        <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Book Appointment <br className="hidden sm:block" />
          With Trusted Doctors
        </h1>

        <div className="flex flex-col items-center gap-3 text-sm text-white sm:flex-row lg:text-base">
          <img src={assets.group_profiles} alt="" className="w-28 sm:w-32" />
          <p className="max-w-md sm:text-left">
            Simply browse through our extensive list of trusted doctors,
            schedule your appointment hassle-free.
          </p>
        </div>
        <a
          href="#speciality"
          className=" flex flex-row items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-transform duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--primary-color) motion-reduce:transition-none motion-reduce:hover:scale-100 sm:text-base"
        >
          Book appointment <img src={assets.arrow_icon} alt="" />
        </a>
      </div>
        {/*image side*/}
      <img
        src={assets.header_img}
        alt="Doctors"
        className="w-full max-w-sm object-contain px-4 pt-6 sm:max-w-md md:w-1/2 md:max-w-none md:self-end md:px-0 md:pt-0"
      />
    </section>
  );
};

export default Hero;
