import { useState } from "react";

type Rules<T> = Partial<Record<keyof T, (val: string) => string | undefined>>;

export function useForm<T extends Record<string, string>>(
  initial: T,
  rules: Rules<T>,
) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const set = (key: keyof T) => (val: string) => {
    setValues((v) => ({ ...v, [key]: val }));
    // clear error on change if field was already touched
    if (touched[key]) {
      const err = rules[key]?.(val);
      setErrors((e) => ({ ...e, [key]: err }));
    }
  };

  const touch = (key: keyof T) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    const err = rules[key]?.(values[key]);
    setErrors((e) => ({ ...e, [key]: err }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let valid = true;
    for (const key in rules) {
      const err = rules[key]?.(values[key]);
      if (err) {
        newErrors[key] = err;
        valid = false;
      }
    }
    setErrors(newErrors);
    setTouched(
      Object.keys(rules).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
    );
    return valid;
  };

  return { values, errors, set, touch, validate };
}
