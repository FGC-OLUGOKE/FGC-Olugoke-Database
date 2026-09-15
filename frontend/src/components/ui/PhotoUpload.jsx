import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import Avatar from "./Avatar";

const MAX_FILE_SIZE_MB = 3;

/**
 * PhotoUpload
 *
 * Circular preview + "Upload"/"Change"/"Remove" control. Since
 * there's no backend yet, the selected image is read via FileReader
 * into a base64 data URL and stored directly on the form field —
 * fully functional for preview/persistence in the in-memory member
 * record today, and a straightforward swap later: once a real
 * upload endpoint exists, replace the FileReader step with an
 * upload call and store the returned URL instead. Nothing else
 * about how `photoUrl` is used elsewhere (Avatar, member records)
 * needs to change.
 *
 * Props:
 * - firstName  (string) — used for the initials fallback while no photo is set
 * - lastName   (string)
 * - value      (string) — current photoUrl, or ""
 * - onChange   (fn)     (dataUrl | "") => void
 */
export default function PhotoUpload({ firstName, lastName, value, onChange, isLoading = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar
        firstName={firstName}
        lastName={lastName}
        photoUrl={value}
        className="h-16 w-16 text-lg"
      />

      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {isLoading ? "Saving..." : value ? "Change Photo" : "Upload Photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={isLoading}
              aria-label="Remove photo"
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#9e263b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">JPG or PNG, up to {MAX_FILE_SIZE_MB}MB.</p>
        {error && <p className="mt-1 text-xs text-[#9e263b]">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
