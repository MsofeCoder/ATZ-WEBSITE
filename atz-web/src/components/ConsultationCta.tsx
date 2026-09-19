"use client";

import { useConsultation } from "@/components/providers/ConsultationProvider";
import ArrowRight from "@/components/icons/ArrowRight";

/** Button that opens the shared consultation dialog. */
export default function ConsultationCta({
  label,
  className = "",
  withArrow = true,
}: {
  label: string;
  className?: string;
  withArrow?: boolean;
}) {
  const { open } = useConsultation();
  return (
    <button type="button" onClick={() => open()} className={className}>
      {label}
      {withArrow && <ArrowRight />}
    </button>
  );
}
