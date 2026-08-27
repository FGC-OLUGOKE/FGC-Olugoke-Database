import { useEffect, useState } from "react";
import { User, Phone, Church, Sparkles } from "lucide-react";
import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import SegmentedControl from "../../../components/ui/SegmentedControl";
import Toggle from "../../../components/ui/Toggle";
import Button from "../../../components/ui/Button";
import PhotoUpload from "../../../components/ui/PhotoUpload";
import MultiSelect from "../../../components/ui/MultiSelect";
import { getCurrentAge } from "../../../lib/birthdayUtils";
import {
  GENDERS,
  MARITAL_STATUSES,
  FORM_CATEGORIES,
  FORM_DEPARTMENTS,
  FORM_STATUSES,
} from "../constants";

// Select-based fields default to "" (unanswered) rather than the
// first option, so the placeholder shows and validation can catch
// an admin who never actually made a choice.
//
// NOTE: `title` was removed entirely per the registration-rules
// update — it's not part of this schema anymore, not just hidden.
const EMPTY_FORM = {
  photoUrl: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  maritalStatus: "",
  phone: "",
  email: "",
  address: "",
  category: "",
  departments: [],
  status: "",
  dateJoined: "",
  baptized: false,
  cellGroup: "",
  serviceUnit: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,}$/;

/**
 * Only First Name, Last Name, Gender, and Date of Birth block
 * submission — per the updated registration rules, everything else
 * (phone, email, address, department, marital status,
 * status, etc.) is optional so an admin can register someone with
 * just their basic identity and complete the rest of the profile
 * later. Phone/email still get FORMAT validation, but only if the
 * admin actually typed something in — an empty value is valid.
 */
function validate(data) {
  const errors = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  if (!data.gender) errors.gender = "Please select a gender";
  if (!data.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
  if (!data.category) errors.category = "Please select a category";

  if (data.phone.trim() && !PHONE_PATTERN.test(data.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }

  if (data.email.trim() && !EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  return errors;
}

/**
 * MemberForm
 *
 * Add/Edit member dialog.
 * - Mobile (≤768px): full-width side drawer.
 * - Desktop (md: and up): centered modal (Drawer's `desktopModal` prop).
 *
 * Registration philosophy: "register the member first, complete the
 * profile later." Only First Name, Last Name, Gender, and Date of
 * Birth are required (marked with a red *) — everything else is
 * optional and won't block saving. Date of Birth shows a live
 * "Age: X" hint underneath since age is always derived, never a
 * separate editable field.
 *
 * Props:
 * - isOpen  (bool)
 * - member  (object|null)  pass a member to edit; null/undefined to add
 * - onClose (fn)
 * - onSave  (fn)  (formData) => void
 */
export default function MemberForm({
  isOpen,
  member,
  onClose,
  onSave,
  submitLabel = "Save Member",
  titleOverride,
  lockedCategory,
}) {
  const isEditing = Boolean(member);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const base = member
        ? { ...EMPTY_FORM, ...member }
        : { ...EMPTY_FORM, category: lockedCategory || "" };
      setFormData(base);
      setErrors({});
    }
  }, [isOpen, member, lockedCategory]);

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

    onSave?.({ ...formData, worker: formData.departments.length > 0 });
  }

  const age = formData.dateOfBirth ? getCurrentAge(formData.dateOfBirth) : null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={titleOverride ?? (isEditing ? "Edit Member" : "Add New Member")}
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
              <SegmentedControl
                label="Gender"
                required
                options={GENDERS}
                value={formData.gender}
                error={errors.gender}
                onChange={(value) => update("gender", value)}
              />
              <div>
                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  error={errors.dateOfBirth}
                  value={formData.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
                {/* Age is always derived from Date of Birth — never a
                    separate editable field. */}
                {age !== null && (
                  <p className="mt-1 text-xs text-gray-400">Age: {age}</p>
                )}
              </div>
            </div>
            <Select
              label="Marital Status"
              placeholder="Select Marital Status"
              options={MARITAL_STATUSES}
              value={formData.maritalStatus}
              onChange={(e) => update("maritalStatus", e.target.value)}
            />
          </FormSection>

          <FormSection
            icon={Phone}
            iconTone="purple"
            title="Contact Information"
          >
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
          </FormSection>

          <FormSection icon={Church} iconTone="gold" title="Church Information">
            <Select
              label="Category"
              required
              placeholder="Select Category"
              options={FORM_CATEGORIES}
              value={formData.category}
              error={errors.category}
              disabled={Boolean(lockedCategory)}
              onChange={(e) => update("category", e.target.value)}
            />
            {lockedCategory && (
              <p className="-mt-2 text-xs text-gray-400">
                Category is set to your assigned scope and can't be changed
                here.
              </p>
            )}
            <MultiSelect
              label="Departments"
              options={FORM_DEPARTMENTS}
              values={formData.departments}
              onChange={(next) => update("departments", next)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                placeholder="Select Status"
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
          </FormSection>

          <FormSection
            icon={Sparkles}
            iconTone="blue"
            title="Spiritual Information"
          >
            <p className="text-sm text-gray-500">
              Members assigned to a department are automatically marked as
              workers.
            </p>
            <Toggle
              label="Baptized"
              checked={formData.baptized}
              onChange={(value) => update("baptized", value)}
            />
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
            <span className="text-[#9e263b]">*</span> Required field —
            everything else can be completed later
          </p>
        </div>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.06)] md:px-8">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {submitLabel}
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
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.bg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${tone.text}`} strokeWidth={2} />
        </span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
