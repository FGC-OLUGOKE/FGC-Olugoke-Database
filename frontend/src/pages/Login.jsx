import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">

          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-4xl text-white">
            ⛪
          </div>

          <h1 className="text-3xl font-bold text-slate-800">
            Church Records
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue
          </p>

        </div>

        <form className="space-y-5">

          {/* Email */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-4 focus-within:border-green-600">

              <HiOutlineMail className="text-xl text-slate-400" />

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent px-3 py-3 outline-none"
              />

            </div>

          </div>

          {/* Password */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-4 focus-within:border-green-600">

              <HiOutlineLockClosed className="text-xl text-slate-400" />

              <input
                type="password"
                placeholder="Enter your password"
                className="w-full bg-transparent px-3 py-3 outline-none"
              />

            </div>

          </div>

          <button
            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;