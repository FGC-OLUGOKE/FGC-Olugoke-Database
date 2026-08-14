import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const DepartmentForm = ({
  department,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    leader: "",
    description: "",
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || "",
        leader: department.leader || "",
        description: department.description || "",
      });
    } else {
      setFormData({
        name: "",
        leader: "",
        description: "",
      });
    }
  }, [department, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      name: formData.name.trim(),
      leader: formData.leader.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {department ? "Edit Department" : "New Department"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {department
                ? "Update the department information."
                : "Create a new church department."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          <Input
            label="Department Name"
            name="name"
            placeholder="e.g. Choir"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Department Leader"
            name="leader"
            placeholder="e.g. John Doe"
            value={formData.leader}
            onChange={handleChange}
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the department..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#154d78] focus:ring-4 focus:ring-[#154d78]/10"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="sm:w-auto"
            >
              {department ? "Save Changes" : "Create Department"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;