import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  CalendarDays,
  Clock3,
  KeyRound,
  CheckCircle2,
  Phone,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { changeProfilePhoto } from "../auth/api";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import PhotoUpload from "../../components/ui/PhotoUpload";

import { getRoleLabel } from "../../lib/permissions";

/**
 * ProfilePage
 *
 * Personal account/profile page for the currently signed-in admin.
 *
 * Profile is intentionally not included in navigation.js.
 * It is accessed from the account dropdown in Navbar.
 */

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");

  if (!user) return null;

  const roleLabel = getRoleLabel(user);

  const isActive = !user.status || user.status === "Active";

  const nameParts = user.name?.trim().split(/\s+/) || [];

  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  const formattedCreatedAt = formatDate(user.createdAt);
  const formattedLastLogin = formatDate(user.lastLogin, true) || "Never";

  async function handlePhotoChange(photoUrl) {
    setIsPhotoSaving(true);
    setPhotoError("");
    try {
      await changeProfilePhoto(photoUrl);
      await refresh();
    } catch (error) {
      setPhotoError(error.message || "We could not update your profile picture.");
    } finally {
      setIsPhotoSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
          Profile
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
          Manage your account information and security.
        </p>
      </div>

      {/* Profile Header */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header background */}
        <div className="h-20 bg-[#154d78] sm:h-24" />

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 sm:-mt-11">
            {/* Avatar */}
            <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
              <Avatar
                firstName={firstName}
                lastName={lastName}
                photoUrl={user.photoUrl}
                className="h-18 w-18 text-xl sm:h-20 sm:w-20 sm:text-2xl"
              />
            </div>

            {/* Profile identity */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold text-gray-900 sm:text-xl">
                  {user.name || "Administrator"}
                </h2>

                <p className="mt-0.5 break-all text-sm text-gray-500">
                  {user.email || "—"}
                </p>
              </div>

              <div className="self-start sm:self-auto">
                <Badge
                  tone={isActive ? "active" : "inactive"}
                >
                  {isActive ? "Active" : user.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileSection
        icon={User}
        title="Profile Picture"
        description="Keep your administrator profile current."
      >
        <div className="col-span-full">
          <PhotoUpload
            firstName={firstName}
            lastName={lastName}
            value={user.photoUrl || ""}
            onChange={handlePhotoChange}
            isLoading={isPhotoSaving}
          />
          {photoError && <p className="mt-2 text-xs text-[#9e263b]">{photoError}</p>}
        </div>
      </ProfileSection>

      {/* Personal Information */}
      <ProfileSection
        icon={User}
        title="Personal Information"
        description="Your basic account information."
      >
        <InfoItem
          label="Full Name"
          value={user.name}
          icon={User}
        />

        <InfoItem
          label="Email Address"
          value={user.email}
          icon={Mail}
        />

        <InfoItem
          label="Phone Number"
          value={user.phone}
          icon={Phone}
        />
      </ProfileSection>

      {/* Administrator Information */}
      <ProfileSection
        icon={ShieldCheck}
        title="Administrator Information"
        description="Your role and access within the church management system."
      >
        <InfoItem
          label="Role"
          value={roleLabel}
          icon={ShieldCheck}
        />

        <InfoItem
          label="Scope"
          value={
            user.scopeLabel || formatScope(user.scope)
          }
          icon={Building2}
        />

        <InfoItem
          label="Account Status"
          value={isActive ? "Active" : user.status}
          icon={CheckCircle2}
        />
      </ProfileSection>

      {/* Account Activity */}
      <ProfileSection
        icon={Clock3}
        title="Account Activity"
        description="Information about your account history."
      >
        <InfoItem
          label="Account Created"
          value={formattedCreatedAt}
          icon={CalendarDays}
        />

        <InfoItem
          label="Last Login"
          value={formattedLastLogin}
          icon={Clock3}
        />
      </ProfileSection>

      {/* Security */}
      <ProfileSection
        icon={KeyRound}
        title="Security"
        description="Keep your administrator account secure."
      >
        <div className="col-span-full flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Password
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Your password is securely stored and never displayed.
            </p>
          </div>

          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/change-password")}
            className="w-full shrink-0 sm:w-auto"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change Password
          </Button>
        </div>
      </ProfileSection>
    </div>
  );
}

/**
 * Section wrapper
 */
function ProfileSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Section header */}
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#154d78]/10 text-[#154d78]">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              {title}
            </h2>

            <p className="mt-0.5 text-xs leading-5 text-gray-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/**
 * Information item
 */
function InfoItem({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        )}

        <p className="min-w-0 text-xs font-medium text-gray-500">
          {label}
        </p>
      </div>

      <p className="mt-1 break-words text-sm font-semibold leading-5 text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

/**
 * Safely formats account dates.
 */
function formatScope(scope) {
  if (Array.isArray(scope)) return scope.join(", ");
  return scope;
}

function formatDate(date, includeTime = false) {
  if (!date) return null;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (includeTime) {
    options.hour = "numeric";
    options.minute = "2-digit";
  }
  return parsedDate.toLocaleString("en-US", options);
}
