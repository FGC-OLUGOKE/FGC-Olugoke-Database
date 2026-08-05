import { useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Users,
  Baby,
  GraduationCap,
  Heart,
} from "lucide-react";

const categories = [
  {
    label: "All",
    icon: Users,
  },
  {
    label: "Children",
    icon: Baby,
  },
  {
    label: "Teenagers",
    icon: GraduationCap,
  },
  {
    label: "Youth",
    icon: Users,
  },
  {
    label: "Adults",
    icon: Heart,
  },
];

const SearchBar = ({ onAddMember }) => {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <section className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          {/* <span className="inline-flex rounded-full bg-[#154d78]/10 px-4 py-2 text-sm font-semibold text-[#154d78]">
            Member Directory
          </span> */}

          {/* <h1 className="mt-4 text-5xl font-bold tracking-tight text-slate-900">
            Church Members
          </h1> */}

          {/* <p className="mt-3 max-w-2xl text-lg text-slate-500">
            Search, manage and organize every church member from one beautiful
            dashboard.
          </p> */}
        </div>

        {/* <button
          onClick={onAddMember}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#154d78] px-7 py-4 font-semibold text-white shadow-lg shadow-[#154d78]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#103c5d]"
        >
          <Plus size={20} />

          Add Member
        </button> */}
      </div>

      {/* Search Card */}

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        {/* Search */}

        <div className="relative">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search by name, phone, email or title..."
            className="h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-14 pr-5 text-[15px] outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#154d78] focus:bg-white focus:ring-4 focus:ring-[#154d78]/10"
          />
        </div>

        {/* Categories */}

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActiveCategory(label)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ${
                activeCategory === label
                  ? "bg-[#154d78] text-white shadow-lg"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#154d78]/20 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />

              {label}
            </button>
          ))}
        </div>

        {/* Filters */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="relative">
            <select className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium outline-none transition focus:border-[#154d78]">
              <option>All Departments</option>
              <option>Choir</option>
              <option>Media</option>
              <option>Ushering</option>
              <option>Children Church</option>
              <option>Prayer</option>
              <option>Evangelism</option>
              <option>Sanctuary Keepers</option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="relative">
            <select className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium outline-none transition focus:border-[#154d78]">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="relative">
            <select className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium outline-none transition focus:border-[#154d78]">
              <option>Sort A → Z</option>
              <option>Sort Z → A</option>
              <option>Newest First</option>
              <option>Oldest First</option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;