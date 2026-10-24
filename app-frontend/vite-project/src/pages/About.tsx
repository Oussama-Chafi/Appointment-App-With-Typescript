import { assets } from "../assets/assets_frontend/assets";

interface Feature {
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    title: "Efficiency",
    description:
      "Streamlined appointment scheduling that fits into your busy lifestyle.",
  },
  {
    title: "Convenience",
    description:
      "Access to a network of trusted healthcare professionals in your area.",
  },
  {
    title: "Personalization",
    description:
      "Tailored recommendations and reminders to help you stay on top of your health.",
  },
];

const About = () => {
  return (
    <section className="mx-2 my-8 text-slate-900 md:mx-8 md:my-12 lg:mx-15 dark:text-white">
      <h2 className="text-center text-2xl font-bold tracking-wide md:text-3xl lg:text-4xl">
        ABOUT US
      </h2>

      <div className="mt-8 flex flex-col items-center gap-8 md:mt-12 md:flex-row md:gap-10 lg:gap-14">
        <img
          src={assets.about_image}
          alt="About Us"
          className="w-full max-w-md rounded-xl object-cover md:w-1/2 md:max-w-none lg:w-5/18"
        />

        <div className="space-y-4 text-sm leading-relaxed text-slate-600 md:w-1/2 md:text-base lg:w-7/12 dark:text-slate-300">
          <p>
            Welcome to Prescripto, your trusted partner in managing your
            healthcare needs conveniently and efficiently. At Prescripto, we
            understand the challenges individuals face when it comes to
            scheduling doctor appointments and managing their health records.
          </p>
          <p>
            Prescripto is committed to excellence in healthcare technology. We
            continuously strive to enhance our platform, integrating the latest
            advancements to improve user experience and deliver superior
            service. Whether you're booking your first appointment or managing
            ongoing care, Prescripto is here to support you every step of the
            way.
          </p>

          <h3 className="pt-2 text-lg font-semibold text-slate-900 md:text-xl dark:text-white">
            Our Vision
          </h3>
          <p>
            Our vision at Prescripto is to create a seamless healthcare
            experience for every user. We aim to bridge the gap between patients
            and healthcare providers, making it easier for you to access the
            care you need, when you need it.
          </p>
        </div>
      </div>

      <div className="mt-14 md:mt-20">
        <h3 className="text-xl md:text-2xl">
          <span className="text-slate-500 dark:text-slate-400">WHY </span>
          <span className="font-bold">CHOOSE US</span>
        </h3>

        <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-slate-200 bg-white p-6 transition-colors duration-300 hover:border-transparent hover:bg-(--primary-color) sm:p-8 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-transparent dark:hover:bg-(--primary-color)"
            >
              <h4 className="text-base font-semibold uppercase tracking-wide group-hover:text-white">
                {feature.title}
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 group-hover:text-white/90 md:text-base dark:text-slate-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
