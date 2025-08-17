
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon } from "lucide-react";
import { CurrencySettings } from "@/components/settings/CurrencySettings";

const Settings = () => {
  return (
    <DashboardLayout 
      title="Settings" 
      description="Configure system settings and preferences"
    >
      <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CurrencySettings />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
