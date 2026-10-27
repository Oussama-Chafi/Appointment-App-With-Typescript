const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-500 focus:ring-red-500/30"
      : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/30 dark:border-slate-600"
  }`;

export default inputClass;
