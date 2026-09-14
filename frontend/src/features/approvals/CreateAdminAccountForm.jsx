import { useEffect, useState } from "react";
import Drawer from "../../components/ui/Drawer";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { FORM_CATEGORIES } from "../members/constants";
import MultiSelect from "../../components/ui/MultiSelect";

const ROLE_OPTIONS = [
  "Category Admin",
  "Departmental Admin",
  "Managing Departments",
  "Pastorate Admin",
];
const ROLE_VALUES = {
  "Category Admin": "category_admin",
  "Departmental Admin": "department_admin",
  "Managing Departments": "managing_departments",
  "Pastorate Admin": "pastorate",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  roleLabel: "Category Admin",
  scope: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (
    data.roleLabel !== "Managing Departments" &&
    data.roleLabel !== "Pastorate Admin" &&
    (!data.scope || data.scope.length === 0)
  ) {
    errors.scope = `Please select ${data.roleLabel === "Category Admin" ? "a category" : "at least one department"}`;
  }
  return errors;
}

/**
 * CreateAdminAccountForm
 *
 * Super Admin only. Dual-purpose — same drawer handles both
 * creating a new account and editing an existing one, matching the
 * Add/Edit pattern MemberForm already uses. Pass `account` (an
 * existing admin) to edit it; omit/pass null to create a new one.
 *
 * Category Admin and Department Admin accounts can be created/edited here.
 * There is no UI path to create or edit a Super Admin account because
 * the Super Admin is the highest authority in the system. ApprovalRequestsPage.jsx already never offers Edit on
 * a super_admin row for the same reason.
 */
export default function CreateAdminAccountForm({
  isOpen,
  account,
  onClose,
  onSave,
  departments = [],
}) {
  const isEditing = Boolean(account);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(
        account
          ? {
              name: account.name,
              email: account.email,
              roleLabel:
                account.role === "category_admin"
                  ? "Category Admin"
                  : account.role === "managing_departments"
                    ? "Managing Departments"
                    : account.role === "pastorate"
                      ? "Pastorate Admin"
                      : "Departmental Admin",
              scope: account.scope ?? "",
            }
          : EMPTY_FORM,
      );
      setErrors({});
    }
  }, [isOpen, account]);

  function update(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "roleLabel"
        ? {
            scope: value === "Pastorate Admin" ? [] : "",
          }
        : {}),
    }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validate({ ...formData, isEditing });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const accountData = {
      name: formData.name,
      email: formData.email,
      role: ROLE_VALUES[formData.roleLabel],
      scope: formData.scope,
    };
    setIsSubmitting(true);
    try {
      await onSave(accountData);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCategoryRole = formData.roleLabel === "Category Admin";
  const isReadOnlyRole = formData.roleLabel === "Managing Departments";
  const isPastorateRole = formData.roleLabel === "Pastorate Admin";
  const availableDepartments = departments.filter(
    (department) =>
      !department.pastorateAdmin ||
      (account?.role === "pastorate" &&
        Array.isArray(account.departments) &&
        account.departments.includes(department.name)),
  );
  const scopeOptions = isCategoryRole
    ? FORM_CATEGORIES
    : availableDepartments.map((department) => department.name);
  const scopeLabel = isCategoryRole ? "Category" : "Department";
  const hasRequiredScope =
    isReadOnlyRole ||
    isPastorateRole ||
    (Array.isArray(formData.scope)
      ? formData.scope.length > 0
      : Boolean(formData.scope));
  const isFormValid =
    Boolean(formData.name.trim()) &&
    EMAIL_PATTERN.test(formData.email.trim()) &&
    hasRequiredScope &&
    true;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Admin Account" : "New Admin Account"}
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
          <Select
            label="Role"
            required
            options={ROLE_OPTIONS.map((label) => ({
              value: label,
              label,
            }))}
            value={formData.roleLabel}
            onChange={(event) => update("roleLabel", event.target.value)}
          />
          {!isReadOnlyRole && !isPastorateRole && (
            <Select
              label={scopeLabel}
              required
              placeholder={`Select ${scopeLabel}`}
              options={scopeOptions}
              value={formData.scope}
              error={errors.scope}
              onChange={(e) => update("scope", e.target.value)}
            />
          )}

          {isPastorateRole && (
            <>
            <MultiSelect
              label="Assigned departments"
              options={scopeOptions}
              values={Array.isArray(formData.scope) ? formData.scope : []}
              onChange={(value) => update("scope", value)}
              error={errors.scope}
            />
            </>
          )}

          {isReadOnlyRole && (
            <p className="text-sm text-gray-500">
              This role can view all church information but cannot change it.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting || !isFormValid}
            loadingLabel={isEditing ? "Saving..." : "Creating..."}
          >
            {isEditing ? "Save Changes" : "Create Account"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
