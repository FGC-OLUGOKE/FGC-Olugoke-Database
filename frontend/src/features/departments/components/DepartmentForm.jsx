import { useEffect, useState } from "react";
import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import MemberPicker from "../../../components/ui/MemberPicker";

const EMPTY_FORM = { name: "", leader: "", description: "" };

function validate(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "Department name is required";
  return errors;
}

/**
 * DepartmentForm
 *
 * Add/Edit department drawer. Leader is picked via MemberPicker
 * (searchable, from members already assigned to this department)
 * instead of free-typed — avoids typos and picking someone who
 * isn't actually in the department. If this is a brand-new
 * department with no members assigned yet, the picker shows a
 * helpful empty state rather than an empty list with no explanation.
 *
 * UI + client-side state only — `onSave` hands the finished data
 * back to the caller. No API call, no persistence.
 *
 * Props:
 * - isOpen     (bool)
 * - department (object|null)  pass to edit; null/undefined to add
 * - members    (array)        full member list, used to filter
 *                              leader candidates by department
 * - onClose    (fn)
 * - onSave     (fn)  (formData) => void
 */
export default function DepartmentForm({ isOpen, department, members = [], onClose, onSave }) {
  const isEditing = Boolean(department);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(department ? { ...EMPTY_FORM, ...department } : EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, department]);

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    onSave?.(formData);
  }

  const departmentMembers = members.filter((m) => m.department === formData.name);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Department" : "Add New Department"}
      widthClass="md:max-w-md"
    >
      <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Input
            label="Department Name"
            error={errors.name}
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
          />

          <MemberPicker
            label="Leader"
            members={departmentMembers}
            value={formData.leader}
            onChange={(name) => update("leader", name)}
            placeholder="Select a leader"
            emptyMessage={
              formData.name.trim()
                ? `No members are assigned to ${formData.name} yet.`
                : "Enter a department name first."
            }
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Department
          </Button>
        </div>
      </form>
    </Drawer>
  );
}