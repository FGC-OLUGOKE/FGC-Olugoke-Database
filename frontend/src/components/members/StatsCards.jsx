import {
  Users,
  UserCheck,
  Building2,
  HeartHandshake,
  ArrowUpRight,
} from "lucide-react";

const StatsCards = ({ members }) => {
  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member) => member.status === "Active"
  ).length;

  const adults = members.filter(
    (member) => member.category === "Adults"
  ).length;

  const departments = new Set(
    members.map((member) => member.department)
  ).size;

  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      subtitle: "Registered members",
      icon: Users,
      accent: "#154d78",
      bg: "bg-[#154d78]/10",
    },

    {
      title: "Active Members",
      value: activeMembers,
      subtitle: "Currently active",
      icon: UserCheck,
      accent: "#4a2969",
      bg: "bg-[#4a2969]/10",
    },

    {
      title: "Departments",
      value: departments,
      subtitle: "Church ministries",
      icon: Building2,
      accent: "#d6b447",
      bg: "bg-[#d6b447]/20",
    },

    {
      title: "Adults",
      value: adults,
      subtitle: "Adult category",
      icon: HeartHandshake,
      accent: "#9e263b",
      bg: "bg-[#9e263b]/10",
    },
  ];

  return (
    <section className="grid gap-6 grid-cols-2 xl:grid-cols-4">
      {stats.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Decorative Circle */}

            <div
              className={`absolute -right-10 -top-10 h-36 w-36 rounded-full ${card.bg}`}
            />

            {/* Top */}

            <div className="relative flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.bg}`}
              >
                <Icon
                  size={28}
                  style={{ color: card.accent }}
                />
              </div>

              <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                +12%
              </div>
            </div>

            {/* Body */}

            <div className="relative mt-8">
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {card.value}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {card.subtitle}
              </p>
            </div>

            {/* Bottom */}

            <div className="relative mt-8">
              <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Growth</span>

                <span>78%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "78%",
                    backgroundColor: card.accent,
                  }}
                />
              </div>

              <button className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:translate-x-1">
                View Details

                <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default StatsCards;