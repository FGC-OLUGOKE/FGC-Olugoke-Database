import { useEffect, useState } from "react";
import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
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

const EMPTY_FORM = {
  title: TITLES[0],
  firstName: "",
  lastName: "",
  gender: GENDERS[0],
  dateOfBirth: "",
  maritalStatus: MARITAL_STATUSES[0],
  phone: "",
  email: "",
  address: "",
  category: FORM_CATEGORIES[0],
  department: FORM_DEPARTMENTS[0],
  status: FORM_STATUSES[0],
  dateJoined: "",
  baptized: false,
  worker: false,
  cellGroup: "",
  serviceUnit: "",
};

/**
 * MemberForm
 *
 * Add/Edit member drawer, built on the shared Drawer shell so it
 * matches MemberDetailsDrawer's animation and layout exactly.
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

  // Reset the form whenever the drawer opens — either to the member
  // being edited, or back to a blank form for "Add New Member".
  useEffect(() => {
    if (isOpen) {
      setFormData(member ? { ...EMPTY_FORM, ...member } : EMPTY_FORM);
    }
  }, [isOpen, member]);

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave?.(formData);
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Member" : "Add New Member"}
      widthClass="md:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Section title="Personal Information">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Title"
                options={TITLES}
                value={formData.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <Select
                label="Gender"
                options={GENDERS}
                value={formData.gender}
                onChange={(e) => update("gender", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <Input
                label="Last Name"
                required
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
                options={MARITAL_STATUSES}
                value={formData.maritalStatus}
                onChange={(e) => update("maritalStatus", e.target.value)}
              />
            </div>
          </Section>

          <Section title="Contact Information">
            <Input
              label="Phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              required
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
                options={FORM_CATEGORIES}
                value={formData.category}
                onChange={(e) => update("category", e.target.value)}
              />
              <Select
                label="Department"
                options={FORM_DEPARTMENTS}
                value={formData.department}
                onChange={(e) => update("department", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Status"
                options={FORM_STATUSES}
                value={formData.status}
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