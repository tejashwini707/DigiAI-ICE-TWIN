import { Package, Fuel, Droplets, Utensils, HeartPulse, Wrench } from "lucide-react";

const CATEGORY_META = {
  fuel: { label: "Polar Fuel Reserves", icon: Fuel, color: "#FB923C" },
  water: { label: "Fresh Water Reserves", icon: Droplets, color: "#60A5FA" },
  food: { label: "Food & Rations", icon: Utensils, color: "#4ADE80" },
  medical: { label: "Medical & Surgical", icon: HeartPulse, color: "#F43F5E" },
  spare_parts: { label: "Spares & Maintenance", icon: Wrench, color: "#A78BFA" },
};

function urgencyColor(daysLeft, thresholdDays = 30) {
  if (daysLeft == null) return "text-[var(--text-secondary)]";
  if (daysLeft <= thresholdDays * 0.5) return "text-red-400 font-bold";
  if (daysLeft <= thresholdDays) return "text-amber-400 font-semibold";
  return "text-emerald-400";
}

export default function ResourcePanel({ resources = [] }) {
  const grouped = resources.reduce((acc, r) => {
    const cat = r.category || "fuel";
    (acc[cat] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--text-primary)] uppercase flex items-center gap-2">
          <Package className="w-4 h-4 text-[var(--ice-cyan)]" />
          Logistics &amp; Supply Depletion
        </h3>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">
          Autonomous Draw
        </span>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => {
          const meta = CATEGORY_META[category] || { label: category, icon: Package, color: "#6FE7DD" };
          const Icon = meta.icon;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                <span>{meta.label}</span>
              </div>

              <div className="space-y-2 bg-[var(--bg-panel-raised)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                {items.map((item) => {
                  const days = item.projectedDaysRemaining ?? (item.dailyConsumptionRate ? Math.round(item.quantity / item.dailyConsumptionRate) : null);
                  const colorClass = urgencyColor(days, item.reorderThresholdDays);

                  return (
                    <div key={item._id || item.name} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="text-[var(--text-primary)] font-medium truncate">{item.name}</p>
                        <p className="font-mono text-[10px] text-[var(--text-tertiary)]">
                          {item.quantity.toLocaleString()} {item.unit}
                          {item.dailyConsumptionRate && ` · ~${item.dailyConsumptionRate} ${item.unit}/day`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-mono text-xs ${colorClass}`}>
                          {days != null ? `${days}d reserve` : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
