import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Settings"
        description="Profile, currency (default PKR), optional location, budget and notification preferences, and privacy."
        icon={Settings}
        emptyTitle="Preferences shell"
        emptyDescription="Account settings will connect after authentication in Phase 3. Currency defaults to PKR; location stays optional and user-controlled."
        phaseNote="Settings UI + prefs — Phase 3 onward."
      />
    </div>
  );
}
