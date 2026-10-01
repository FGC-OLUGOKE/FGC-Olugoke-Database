const STORAGE_KEY = "fgc-attendance-sessions";

function readSessions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sessions)
  );
}

export async function getAttendanceHistory() {
  return readSessions();
}

export async function getAttendanceSession(sessionId) {
  const sessions = readSessions();

  return (
    sessions.find(
      (session) => String(session.id) === String(sessionId)
    ) || null
  );
}

export async function createAttendanceSession(
  payload
) {
  const sessions = readSessions();

  const session = {
    ...payload,
    id: `attendance-${Date.now()}`,
    status: payload.status || "saved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [session, ...sessions];

  writeSessions(updated);

  return session;
}

export async function updateAttendanceSession(
  sessionId,
  changes
) {
  const sessions = readSessions();

  const index = sessions.findIndex(
    (session) =>
      String(session.id) === String(sessionId)
  );

  if (index === -1) {
    throw new Error("Attendance session not found.");
  }

  if (
    sessions[index].status === "submitted" ||
    sessions[index].status === "locked"
  ) {
    throw new Error("Submitted attendance sessions cannot be edited.");
  }

  const updatedSession = {
    ...sessions[index],
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  sessions[index] = updatedSession;

  writeSessions(sessions);

  return updatedSession;
}

export async function saveClassAttendance({
  sessionId,
  classId,
  attendance,
}) {
  const sessions = readSessions();

  const index = sessions.findIndex(
    (session) =>
      String(session.id) === String(sessionId)
  );

  if (index === -1) {
    throw new Error("Attendance session not found.");
  }

  const session = sessions[index];

  if (
    session.status === "submitted" ||
    session.status === "locked"
  ) {
    throw new Error(
      "This attendance session has already been submitted."
    );
  }

  const existingRecords =
    session.attendanceRecords || [];

  const filteredRecords = existingRecords.filter(
    (record) =>
      String(record.classId) !== String(classId)
  );

  const classRecords = Object.entries(
    attendance || {}
  ).map(([memberId, status]) => ({
    memberId,
    classId,
    status,
  }));

  sessions[index] = {
    ...session,
    attendanceRecords: [
      ...filteredRecords,
      ...classRecords,
    ],
    updatedAt: new Date().toISOString(),
  };

  writeSessions(sessions);

  return sessions[index];
}

export async function saveServiceAttendance({
  sessionId,
  attendance,
}) {
  const sessions = readSessions();

  const index = sessions.findIndex(
    (session) =>
      String(session.id) === String(sessionId)
  );

  if (index === -1) {
    throw new Error("Attendance session not found.");
  }

  const session = sessions[index];

  if (
    session.status === "submitted" ||
    session.status === "locked"
  ) {
    throw new Error(
      "This attendance session has already been submitted."
    );
  }

  sessions[index] = {
    ...session,
    serviceAttendance: attendance,
    updatedAt: new Date().toISOString(),
  };

  writeSessions(sessions);

  return sessions[index];
}

export async function deleteAttendanceSession(
  sessionId
) {
  const sessions = readSessions();

  const session = sessions.find(
    (item) =>
      String(item.id) === String(sessionId)
  );

  if (!session) {
    throw new Error("Attendance session not found.");
  }

  if (
    session.status === "submitted" ||
    session.status === "locked"
  ) {
    throw new Error(
      "Submitted attendance sessions cannot be deleted."
    );
  }

  const updated = sessions.filter(
    (item) =>
      String(item.id) !== String(sessionId)
  );

  writeSessions(updated);

  return true;
}

export async function submitAttendanceSession(sessionId) {
  return updateAttendanceSession(sessionId, {
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
}