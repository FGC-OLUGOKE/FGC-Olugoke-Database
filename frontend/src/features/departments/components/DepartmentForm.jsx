import { useEffect, useMemo, useState } from "react";

import { Building2, X } from "lucide-react";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import MemberPicker from "../../../components/ui/MemberPicker";

const EMPTY_FORM = {
  name: "",
  leader: "",
  description: "",
};

function validate(data) {
  const errors = {};

  if (!data.name.trim()) {
    errors.name = "Department name is required";
  }

  return errors;
}

/**
 * DepartmentForm
 *
 * Add/Edit department modal.
 *
 * New department:
 * - Department name
 * - Description
 *
 * Existing department:
 * - Department name
 * - Description
 * - Leader
 *
 * Leaders are not selected when creating a new department.
 * A leader can be assigned later from DepartmentDetailsDrawer
 * after members have been added to the department.
 *
 * UI + client-side state only.
 * onSave hands the finished data back to the caller.
 */
export default function DepartmentForm({
  isOpen,
  department,
  members = [],
  onClose,
  onSave,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(department);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setFormData(
      department
        ? {
            ...EMPTY_FORM,
            ...department,
          }
        : EMPTY_FORM,
    );

    setErrors({});
  }, [isOpen, department]);

  function update(field, value) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  }

  const departmentMembers = useMemo(() => {
    if (!isEditing || !department) return [];

    return members.filter((member) => {
      const memberDepartments = Array.isArray(member.departments)
        ? member.departments
        : [];

      return memberDepartments.includes(department.name);
    });
  }, [members, department, isEditing]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-form-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4a2969]/10">
              <Building2 className="h-5 w-5 text-[#4a2969]" />
            </div>

            <div>
              <h2
                id="department-form-title"
                className="text-lg font-semibold text-gray-900"
              >
                {isEditing
                  ? "Edit Department"
                  : "Create New Department"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isEditing
                  ? "Update this department's information."
                  : "Create a department and add members to it later."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* Basic information */}
            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Department Information
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Provide the basic information for this department.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Department Name"
                  required
                  placeholder="e.g. Choir, Media, Ushering"
                  error={errors.name}
                  value={formData.name}
                  onChange={(event) =>
                    update("name", event.target.value)
                  }
                />

                <div>
                  <label
                    htmlFor="department-description"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Description
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="department-description"
                    value={formData.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    placeholder="Briefly describe the purpose of this department..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors placeholder:text-gray-400 focus:border-[#154d78] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />

                  <p className="mt-1.5 text-xs text-gray-400">
                    A short description helps administrators understand
                    what this department is responsible for.
                  </p>
                </div>
              </div>
            </section>

            {/* Leader - Edit only */}
            {isEditing && (
              <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Department Admin
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Select the Department Admin from members already assigned
                    to this department.
                  </p>
                </div>

                {departmentMembers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-4 text-sm text-gray-500">
                    No members are currently assigned to this
                    department. Add members first, then assign a Department
                    Admin from the department details.
                  </div>
                ) : (
                  <MemberPicker
                    label="Department Admin"
                    members={departmentMembers}
                    value={formData.leader}
                    onChange={(name) =>
                      update("leader", name)
                    }
                    placeholder="Select a Department Admin"
                    emptyMessage="No members are available to be selected as Department Admin."
                  />
                )}
              </section>
            )}

            {/* New department information */}
            {!isEditing && (
              <div className="rounded-xl border border-[#154d78]/10 bg-[#154d78]/5 px-4 py-4">
                <p className="text-sm font-medium text-[#154d78]">
                  What happens next?
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-600">
                  After creating the department, you can open it,
                  add existing church members, and then assign one
                  of those members as the department leader.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" isLoading={isSubmitting} loadingLabel={isEditing ? "Saving..." : "Creating..."}>
              {isEditing
                ? "Save Changes"
                : "Create Department"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
