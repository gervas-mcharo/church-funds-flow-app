
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon } from "lucide-react";
import { CurrencySettings } from "@/components/settings/CurrencySettings";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CurrencySettings />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
