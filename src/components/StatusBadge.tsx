import { Clock, PhoneCall, UserCheck, AlertCircle } from "lucide-react";
import { Status } from "../types/status";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const getStatusColor = (status: Status) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "called":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "seated":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-3 h-3" />;
      case "called":
        return <PhoneCall className="w-3 h-3" />;
      case "seated":
        return <UserCheck className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {status}
    </span>
  );
}
