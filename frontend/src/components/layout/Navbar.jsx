import logo from "../../../public/logo.svg";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Left */}

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl">
            <img src={logo} alt="Logo" className="h-10 w-10" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              FGC Olugoke Database
            </h1>

            <p className="text-sm text-slate-500">
              Member Management System
            </p>
          </div>
        </div>

        {/* Right */}

        <div className="flex items-center gap-6 hidden lg:flex">
          {/* Notifications */}

          <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:border-[#154d78]/30 hover:bg-slate-50">
            🔔

            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#9e263b]" />
          </button>

          {/* Admin */}

          <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 pr-5 transition hover:shadow-md">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="Administrator"
              className="h-12 w-12 rounded-xl object-cover"
            />

            <div className="text-left">
              <p className="font-semibold text-slate-900">
                Administrator
              </p>

              <p className="text-sm text-slate-500">
                Church Admin
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Brand Line */}

      <div className="flex h-1 w-full">
        <div className="flex-1 bg-[#FE0000]" />
        <div className="flex-1 bg-[#363A93]" />
        <div className="flex-1 bg-[#FEB914]" />
        <div className="flex-1 bg-[#B92B8F]" />
      </div>
    </header>
  );
};

export default Navbar;