// src/components/admin/StatCard.tsx
import React from "react";
import clsx from "clsx";
import { colors, textStyles } from "@/design-system/foundations";

type StatCardProps = {
  icon: React.ReactNode;
  type: string;
  count: number | string;
  label: string;
};

export default function StatCard({
  icon,
  type,
  count,
  label,
}: StatCardProps) {

  const colorClassConfig = {
    default: {
      ripple: colors.neutral.N100,
      iconBg: colors.neutral.N200,
    },
    blue: {
      ripple: colors.blue.B50,
      iconBg: colors.blue.B200,
    },
    red: {
      ripple: colors.red.R50,
      iconBg: colors.red.R200,
    },
    green: {
      ripple: colors.green.G50,
      iconBg: colors.green.G200,
    },
    gray: {
      ripple: colors.neutral.N100,
      iconBg: colors.neutral.N200,
    },
  }

  const config = colorClassConfig[type as keyof typeof colorClassConfig] || colorClassConfig.default;

  return (
    <div
      className={clsx(
        "border-[#E5E5E5] rounded-3xl bg-white shadow-sm border flex flex-col items-start px-6 py-4 min-w-[150px] w-full custom-card-shadow"
      )}
    >
      <div
        className="rounded-full flex items-center justify-center mb-4 w-10 h-10 -ml-1"
        style={{ backgroundColor: config.ripple }}
      >
      <div
        className="rounded-full flex items-center justify-center w-8 h-8"
        style={{ backgroundColor: config.iconBg }}
      >
          <span className={clsx("text-2xl")}>{icon}</span>
      </div>
      </div>
      <div className="mb-0.5" style={{ ...textStyles.h2 }}>{count}</div>
      <p className="text-gray-500" style={{ ...textStyles.body1Reg }}>{label}</p>
    </div>
  );
}