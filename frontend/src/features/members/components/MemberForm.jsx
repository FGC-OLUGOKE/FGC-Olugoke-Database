import { useEffect, useState } from "react";
import { User, Phone, Church, Sparkles } from "lucide-react";
import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import SegmentedControl from "../../../components/ui/SegmentedControl";
import Toggle from "../../../components/ui/Toggle";
import Button from "../../../components/ui/Button";
import PhotoUpload from "../../../components/ui/PhotoUpload";
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
  photoUrl: "",
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
 *
 * UNCHANGED from the previous version — this redesign is visual only.
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
 * Add/Edit member dialog.
 * - Mobile (≤768px): full-width side drawer, unchanged.
 * - Desktop (md: and up): centered modal with backdrop blur, rounded
 *   corners, capped height with internal scroll — via Drawer's
 *   `desktopModal` prop. Pure CSS breakpoint switch, no JS involved.
 *
 * Every required field (matching `validate()` above exactly) shows a
 * red asterisk beside its label via the `required` prop on
 * Input/Select/SegmentedControl. Section headers now carry a small
 * tinted icon badge for stronger visual hierarchy/scannability.
 *
 * Functionality/validation logic is UNCHANGED from before — this is
 * a visual/layout redesign only. `onSave` still just hands the
 * finished form data back to the caller; no API call happens here.
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

  useEffect(() => {
    if (isOpen) {
      setFormData(member ? { ...EMPTY_FORM, ...member } : EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, member]);

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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Member" : "Add New Member"}
      widthClass="md:max-w-2xl"
      desktopModal
    >
      <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 md:px-8 md:py-7">
          <FormSection icon={User} iconTone="blue" title="Personal Information">
            <PhotoUpload
              firstName={formData.firstName}
              lastName={formData.lastName}
              value={formData.photoUrl}
              onChange={(dataUrl) => update("photoUrl", dataUrl)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Title"
                required
                placeholder="Select Title"
                options={TITLES}
                value={formData.title}
                error={errors.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <SegmentedControl
                label="Gender"
                required
                options={GENDERS}
                value={formData.gender}
                error={errors.gender}
                onChange={(value) => update("gender", value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                error={errors.firstName}
                value={formData.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <Input
                label="Last Name"
                required
                error={errors.lastName}
                value={formData.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
              <Select
                label="Marital Status"
                required
                placeholder="Select Marital Status"
                options={MARITAL_STATUSES}
                value={formData.maritalStatus}
                error={errors.maritalStatus}
                onChange={(e) => update("maritalStatus", e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection icon={Phone} iconTone="purple" title="Contact Information">
            <Input
              label="Phone"
              type="tel"
              required
              error={errors.phone}
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              required
              error={errors.email}
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </FormSection>

          <FormSection icon={Church} iconTone="gold" title="Church Information">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                required
                placeholder="Select Category"
                options={FORM_CATEGORIES}
                value={formData.category}
                error={errors.category}
                onChange={(e) => update("category", e.target.value)}
              />
              <Select
                label="Department"
                required
                placeholder="Select Department"
                options={FORM_DEPARTMENTS}
                value={formData.department}
                error={errors.department}
                onChange={(e) => update("department", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                required
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
          </FormSection>

          <FormSection icon={Sparkles} iconTone="blue" title="Spiritual Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </FormSection>

          <p className="text-xs text-gray-400">
            <span className="text-[#9e263b]">*</span> Required field
          </p>
        </div>

        {/* Sticky footer with a subtle top shadow so it reads as
            "above" the scrollable content rather than just stacked
            beneath it. */}
        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.06)] md:px-8">
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

const ICON_TONES = {
  blue: { bg: "bg-[#154d78]/10", text: "text-[#154d78]" },
  purple: { bg: "bg-[#4a2969]/10", text: "text-[#4a2969]" },
  gold: { bg: "bg-[#d6b447]/15", text: "text-[#7a5f24]" },
};

function FormSection({ icon: Icon, iconTone = "blue", title, children }) {
  const tone = ICON_TONES[iconTone];
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${tone.text}`} strokeWidth={2} />
        </span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
    }
