import { ATTENDANCE_TYPES } from "./attendanceConstants";

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function memberName(member) {
  return (
    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
    member.name ||
    "Unnamed member"
  );
}

export function labelForType(typeId, checkpoint) {
  const type = ATTENDANCE_TYPES.find((item) => item.id === typeId);

  if (typeId === "sunday-service") {
    return `${type?.title || "Sunday Service"} - ${
      checkpoint === "pre-sermon" ? "Pre-Sermon" : "Post-Sermon"
    }`;
  }

  return type?.title || "Attendance";
}

export function statusLabel(status) {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  return "Not Recorded";
}
