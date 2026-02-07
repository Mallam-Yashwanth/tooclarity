import Joi from "joi";

type AnyRecord = Record<string, unknown>;

/**
 * Validates a single field against a schema.
 * Updated to handle field dependencies (like availableSeats <= totalSeats)
 * by validating the key within the context of the whole object if necessary.
 */
export const validateField = (
  schema: Joi.ObjectSchema<AnyRecord>,
  name: string,
  value: unknown,
  fullData?: AnyRecord // Added context for cross-field validation
): string | undefined => {
  // Check if the key exists in the schema to avoid "extract" errors
  const keyExists = schema.$_terms.keys?.some((k: { key?: string }) => k.key === name);
  if (!keyExists) return undefined;

  let error;
  
  if (fullData) {
    // If we have full data, validate the whole object but only return the error for this field
    // This allows Joi.ref() and other dependencies to work.
    const { error: fullError } = schema.validate(
      { ...fullData, [name]: value }, 
      { abortEarly: false, allowUnknown: true }
    );
    error = fullError?.details.find((d) => d.path[0] === name);
  } else {
    // Fallback to single field extraction
    const { error: extractError } = schema.extract(name).validate(value, { abortEarly: true });
    error = extractError?.details[0];
  }

  return error ? error.message.replace('"value"', name) : undefined;
};

/**
 * Validates the entire form and returns a map of errors.
 */
export const validateForm = (schema: Joi.ObjectSchema<AnyRecord>, formData: AnyRecord) => {
  const { error } = schema.validate(formData, { abortEarly: false, allowUnknown: true });
  if (!error) return {};

  const errors: Record<string, string> = {};
  error.details.forEach((err) => {
    const fieldName = err.path[0] as string;
    // Prioritize custom messages defined in the schema
    errors[fieldName] = err.message.replace('"value"', fieldName);
  });

  return errors;
};