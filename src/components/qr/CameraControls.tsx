
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, SwitchCamera, Zap, ZapOff } from "lucide-react";
import { CameraDevice } from "@/types/qr";

interface CameraControlsProps {
  devices: CameraDevice[];
  currentDevice: CameraDevice | null;
  onDeviceChange: (deviceId: string) => void;
  onFlashToggle?: () => void;
  isFlashOn?: boolean;
  isFlashSupported?: boolean;
}

export const CameraControls = ({
  devices,
  currentDevice,
  onDeviceChange,
  onFlashToggle,
  isFlashOn = false,
  isFlashSupported = false
}: CameraControlsProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg">
      {devices.length > 1 && (
        <Select
          value={currentDevice?.deviceId || ""}
          onValueChange={onDeviceChange}
        >
          <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  {device.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {devices.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const currentIndex = devices.findIndex(d => d.deviceId === currentDevice?.deviceId);
            const nextIndex = (currentIndex + 1) % devices.length;
            onDeviceChange(devices[nextIndex].deviceId);
          }}
          className="text-white hover:bg-white/20"
        >
          <SwitchCamera className="h-4 w-4" />
        </Button>
      )}

      {isFlashSupported && onFlashToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onFlashToggle}
          className="text-white hover:bg-white/20"
        >
          {isFlashOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
};
