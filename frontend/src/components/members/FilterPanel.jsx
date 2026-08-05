const FilterPanel = () => {
  return (
    <aside className="hidden lg:block w-72 shrink-0">

      <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-lg font-bold text-slate-800">
          Filters
        </h2>

        {/* Category */}

        <div className="mb-8">

          <h3 className="mb-3 font-semibold">
            Category
          </h3>

          <div className="space-y-2">

            <button className="block w-full rounded-lg bg-green-600 px-4 py-2 text-left text-white">
              All
            </button>

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Children
            </button>

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Teenagers
            </button>

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Youth
            </button>

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Adult
            </button>

          </div>

        </div>

        {/* Gender */}

        <div className="mb-8">

          <h3 className="mb-3 font-semibold">
            Gender
          </h3>

          <div className="space-y-2">

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Male
            </button>

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Female
            </button>

          </div>

        </div>

        {/* Status */}

        <div>

          <h3 className="mb-3 font-semibold">
            Status
          </h3>

          <div className="space-y-2">

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Active
            </button>

            <button className="block w-full rounded-lg px-4 py-2 text-left hover:bg-slate-100">
              Inactive
            </button>

          </div>

        </div>

      </div>

    </aside>
  );
};

export default FilterPanel;