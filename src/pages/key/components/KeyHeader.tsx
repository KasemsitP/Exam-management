// components/KeyHeader.tsx
import { Lock } from "lucide-react";

interface KeyHeaderProps {
  activeCampaign: any;
}

export default function KeyHeader({ activeCampaign }: KeyHeaderProps) {
  return (
    <div className="d-flex align-items-start gap-3 mb-4">
      <div className="rounded-circle bg-primary-subtle p-2 text-primary d-inline-flex">
        <Lock size={24} />
      </div>
      <div>
        <h1 className="h4 mb-1">คีย์และการเข้ารหัส</h1>
        {activeCampaign && (
          <div className="small text-muted">
            สนามสอบ:{" "}
            <span className="fw-semibold text-body">
              {activeCampaign.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
