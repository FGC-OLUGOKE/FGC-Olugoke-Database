import { useEffect, useState } from "react";

const departments = [
  "Choir",
  "Media",
  "Ushering",
  "Children Church",
  "Prayer",
  "Evangelism",
  "Sanctuary Keepers",
  "Protocol",
];

const categories = [
  "Children",
  "Teenagers",
  "Youth",
  "Adults",
];

const titles = [
  "",
  "Pastor",
  "Reverend",
  "Deacon",
  "Deaconess",
  "Mr",
  "Mrs",
  "Miss",
];

const initialState = {
  firstName: "",
  lastName: "",
  gender: "",
  title: "",
  email: "",
  phone: "",
  address: "",
  department: "",
  category: "",
  maritalStatus: "",
  status: "Active",
  dateJoined: "",
};

const MemberForm = ({
  isOpen,
  onClose,
  member,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(initialState);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (member) {
      setFormData({
        ...initialState,
        ...member,
      });

      setPreview(member.picture || "");
    } else {
      setFormData(initialState);
      setPreview("");
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(formData);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-5 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
      >
        {/* HEADER */}

        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-[#154d78]/10 px-4 py-1 text-sm font-semibold text-[#154d78]">
                Church Registry
              </span>

              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                {member ? "Edit Member" : "Add New Member"}
              </h2>

              <p className="mt-2 text-slate-500">
                Register and manage member information.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-600 transition hover:bg-slate-200"
            >
              ×
            </button>
          </div>
        </div>

        {/* BODY */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-8 py-8"
        >
          {/* PHOTO */}

          <section className="mb-10">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Profile Picture
              </h3>

              <div className="mt-2 h-1 w-16 rounded-full bg-[#154d78]" />
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8">
              <div className="flex flex-col items-center gap-6 lg:flex-row">
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-md">
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-center text-sm text-slate-400">
                      No Photo
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-slate-800">
                    Upload Member Photo
                  </h4>

                  <p className="mt-2 text-slate-500">
                    JPG, PNG or WEBP. Maximum size 5MB.
                  </p>

                  <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-[#154d78] px-6 py-3 font-semibold text-white transition hover:bg-[#103c5d]">
                    Choose Image

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* PERSONAL */}

          <section>
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Personal Information
              </h3>

              <div className="mt-2 h-1 w-16 rounded-full bg-[#9e263b]" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  First Name *
                </label>

                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Last Name *
                </label>

                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Gender *
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </label>

                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                >
                  {titles.map((title) => (
                    <option key={title} value={title}>
                      {title || "Select Title"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone Number
                </label>

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <textarea
                  rows={4}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                />
              </div>
            </div>
          </section>

          {/* Church Information and Footer continue in Part 2 */}

                    {/* CHURCH INFORMATION */}

          <section className="mt-12">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Church Information
              </h3>

              <div className="mt-2 h-1 w-16 rounded-full bg-[#d6b447]" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Department
                </label>

                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                >
                  <option value="">Select Department</option>

                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date Joined
                </label>

                <input
                  type="date"
                  name="dateJoined"
                  value={formData.dateJoined}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Marital Status
                </label>

                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#154d78]"
                >
                  <option value="">Select Status</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widowed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Member Status
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        status: "Active",
                      })
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      formData.status === "Active"
                        ? "border-[#4a2969] bg-[#4a2969]/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <h4 className="font-semibold">
                      Active
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Currently attending church.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        status: "Inactive",
                      })
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      formData.status === "Inactive"
                        ? "border-[#9e263b] bg-[#9e263b]/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <h4 className="font-semibold">
                      Inactive
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Not currently attending.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <div className="sticky bottom-0 mt-12 border-t border-slate-200 bg-white px-1 pt-8">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-300 px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-2xl bg-[#154d78] px-8 py-4 font-semibold text-white transition hover:bg-[#103c5d]"
              >
                {member ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;