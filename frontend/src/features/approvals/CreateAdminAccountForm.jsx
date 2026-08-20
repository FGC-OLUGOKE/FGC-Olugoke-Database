import { useEffect, useState } from "react";
import Drawer from "../../components/ui/Drawer";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import SegmentedControl from "../../components/ui/SegmentedControl";
import Button from "../../components/ui/Button";
import { FORM_CATEGORIES, FORM_DEPARTMENTS } from "../members/constants";

const ROLE_OPTIONS = ["Category Admin", "Department Admin"];
const ROLE_VALUE_MAP = {
  "Category Admin": "category_admin",
  "Department Admin": "department_admin",
};

const EMPTY_FORM = { name: "", email: "", roleLabel: "Category Admin", scope: "" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!data.scope) {
    errors.scope = `Please select a ${data.roleLabel === "Category Admin" ? "category" : "department"}`;
  }
  return errors;
}

/**
 * CreateAdminAccountForm
 *
 * Super Admin only. Per the spec, only Category Admin and
 * Department Admin accounts can be created here — there's no UI
 * path to create another Super Admin, matching "the highest
 * authority in the system" framing (that's a decision that
 * shouldn't happen from within the app itself).
 */
export default function CreateAdminAccountForm({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen]);

  function update(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "roleLabel" ? { scope: "" } : {}), // reset scope when role changes
    }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave({
      name: formData.name,
      email: formData.email,
      role: ROLE_VALUE_MAP[formData.roleLabel],
      scope: formData.scope,
    });
  }

  const scopeOptions = formData.roleLabel === "Category Admin" ? FORM_CATEGORIES : FORM_DEPARTMENTS;
  const scopeLabel = formData.roleLabel === "Category Admin" ? "Category" : "Department";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="New Admin Account"
      widthClass="md:max-w-md"
      desktopModal
    >
      <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Input
            label="Full Name"
            required
            error={errors.name}
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            required
            error={errors.email}
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <SegmentedControl
            label="Role"
            required
            options={ROLE_OPTIONS}
            value={formData.roleLabel}
            onChange={(value) => update("roleLabel", value)}
          />
          <Select
            label={scopeLabel}
            required
            placeholder={`Select ${scopeLabel}`}
            options={scopeOptions}
            value={formData.scope}
            error={errors.scope}
            onChange={(e) => update("scope", e.target.value)}
          />
        </div>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create Account
          </Button>
        </div>
      </form>
    </Drawer>
  );
}