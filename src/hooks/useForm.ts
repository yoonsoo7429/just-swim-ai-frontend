import { useState } from "react";
import { FormState } from "../types";

export const useForm = <T extends Record<string, any>>(initialState: T) => {
  const [form, setForm] = useState<T>(initialState);
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: "",
    success: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm(initialState);
    setFormState({
      loading: false,
      error: "",
      success: "",
    });
  };

  const setLoading = (loading: boolean) => {
    setFormState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string) => {
    setFormState((prev) => ({ ...prev, error, success: "" }));
  };

  const setSuccess = (success: string) => {
    setFormState((prev) => ({ ...prev, success, error: "" }));
  };

  const clearMessages = () => {
    setFormState((prev) => ({ ...prev, error: "", success: "" }));
  };

  return {
    form,
    setForm,
    formState,
    handleChange,
    resetForm,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
  };
};
