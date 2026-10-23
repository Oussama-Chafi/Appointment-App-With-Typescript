import { assets } from "../assets/assets_frontend/assets";

const Banner = () => {
  return (
    <section className="mx-2 my-8 flex flex-col items-center overflow-hidden rounded-lg bg-(--primary-color) dark:bg-(--header-dark-bg-color) md:mx-8 md:my-16 md:flex-row md:justify-between lg:mx-15">
      {/* Text side */}
      <div className="flex w-full flex-col items-center gap-6 px-6 pt-10 text-center md:w-1/2 md:items-start md:px-10 md:py-12 md:text-left lg:px-16 lg:py-20">
        <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Book Appointment <br className="hidden sm:block" />
          With 100+ Trusted Doctors
        </h2>

        <button
          type="button"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-transform duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--primary-color) motion-reduce:transition-none motion-reduce:hover:scale-100 sm:text-base"
        >
          Create account
        </button>
      </div>

      {/* Image side */}
      <img
        src={assets.appointment_img}
        alt=""
        className="w-full max-w-xs object-contain px-4 pt-6 sm:max-w-sm md:w-1/2 md:max-w-none md:self-end md:px-0 md:pt-0 lg:w-5/18"
      />
    </section>
  );
};

export default Banner;
