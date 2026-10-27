import type { FieldProps } from "../types/app";

const Field = ({ id, children, label, className, error }: FieldProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </label>
      {children}
      {error && (
        <p
          role="alert"
          className="mt-1.5 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
