import { useEffect, useState } from "react";
import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import SegmentedControl from "../../../components/ui/SegmentedControl";
import Toggle from "../../../components/ui/Toggle";
import Button from "../../../components/ui/Button";
import {
  TITLES,
  GENDERS,
  MARITAL_STATUSES,
  FORM_CATEGORIES,
  FORM_DEPARTMENTS,
  FORM_STATUSES,
} from "../constants";

// Select-based fields default to "" (unanswered) rather than the
// first option, so the placeholder shows and validation can catch
// an admin who never actually made a choice.
const EMPTY_FORM = {
  title: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  maritalStatus: "",
  phone: "",
  email: "",
  address: "",
  category: "",
  department: "",
  status: "",
  dateJoined: "",
  baptized: false,
  worker: false,
  cellGroup: "",
  serviceUnit: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,}$/;

/**
 * Validates the fields required to identify, reach, and correctly
 * categorize a member. Returns an object keyed by field name — an
 * empty object means the form is valid.
 */
function validate(data) {
  const errors = {};

  if (!data.title) errors.title = "Please select a title";
  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  if (!data.gender) errors.gender = "Please select a gender";
  if (!data.maritalStatus) errors.maritalStatus = "Please select a marital status";

  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_PATTERN.test(data.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!data.category) errors.category = "Please select a category";
  if (!data.department) errors.department = "Please select a department";
  if (!data.status) errors.status = "Please select a status";

  return errors;
}

/**
 * MemberForm
 *
 * Add/Edit member drawer, built on the shared Drawer shell so it
 * matches MemberDetailsDrawer's animation and layout exactly.
 *
 * Every Select in this form uses a disabled placeholder option
 * ("Select Title", "Select Department", etc.) so admins can't
 * accidentally submit a form where they never actually chose a
 * value — the placeholder shows by default but can't be re-selected
 * once a real option is picked, and validation treats "" as unset.
 * Gender uses a two-option SegmentedControl instead of a dropdown,
 * since a Select is overkill for exactly two choices.
 *
 * This is UI + client-side form state only — `onSave` just hands the
 * finished form data back to the caller. It does NOT call an API or
 * persist anything; wiring `onSave` to a real request is the
 * caller's job once the backend exists.
 *
 * Props:
 * - isOpen  (bool)
 * - member  (object|null)  pass a member to edit; null/undefined to add
 * - onClose (fn)
 * - onSave  (fn)  (formData) => void
 */
export default function MemberForm({ isOpen, member, onClose, onSave }) {
  const isEditing = Boolean(member);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Reset the form (and any leftover errors) whenever the drawer
  // opens — either to the member being edited, or a blank form.
  useEffect(() => {
    if (isOpen) {
      setFormData(member ? { ...EMPTY_FORM, ...member } : EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, member]);

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear that field's error as soon as the user starts fixing it,
    // rather than making them resubmit to see it disappear.
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Member" : "Add New Member"}
      widthClass="md:max-w-lg"
    >
      <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Section title="Personal Information">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Title"
                placeholder="Select Title"
                options={TITLES}
                value={formData.title}
                error={errors.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <SegmentedControl
                label="Gender"
                options={GENDERS}
                value={formData.gender}
                error={errors.gender}
                onChange={(value) => update("gender", value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                error={errors.firstName}
                value={formData.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <Input
                label="Last Name"
                error={errors.lastName}
                value={formData.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
              <Select
                label="Marital Status"
                placeholder="Select Marital Status"
                options={MARITAL_STATUSES}
                value={formData.maritalStatus}
                error={errors.maritalStatus}
                onChange={(e) => update("maritalStatus", e.target.value)}
              />
            </div>
          </Section>

          <Section title="Contact Information">
            <Input
              label="Phone"
              type="tel"
              error={errors.phone}
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email}
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </Section>

          <Section title="Church Information">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                placeholder="Select Category"
                options={FORM_CATEGORIES}
                value={formData.category}
                error={errors.category}
                onChange={(e) => update("category", e.target.value)}
              />
              <Select
                label="Department"
                placeholder="Select Department"
                options={FORM_DEPARTMENTS}
                value={formData.department}
                error={errors.department}
                onChange={(e) => update("department", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Status"
                placeholder="Select Status"
                options={FORM_STATUSES}
                value={formData.status}
                error={errors.status}
                onChange={(e) => update("status", e.target.value)}
              />
              <Input
                label="Date Joined"
                type="date"
                value={formData.dateJoined}
                onChange={(e) => update("dateJoined", e.target.value)}
              />
            </div>
          </Section>

          <Section title="Spiritual Information">
            <Toggle
              label="Baptized"
              checked={formData.baptized}
              onChange={(v) => update("baptized", v)}
            />
            <Toggle
              label="Worker"
              checked={formData.worker}
              onChange={(v) => update("worker", v)}
            />
            <Input
              label="Cell Group"
              value={formData.cellGroup}
              onChange={(e) => update("cellGroup", e.target.value)}
            />
            <Input
              label="Service Unit"
              value={formData.serviceUnit}
              onChange={(e) => update("serviceUnit", e.target.value)}
            />
          </Section>
        </div>

        {/* Sticky footer — stays pinned while the fields above scroll */}
        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Member
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}