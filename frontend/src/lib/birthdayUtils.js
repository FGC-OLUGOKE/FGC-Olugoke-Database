/**
 * Shared birthday math — used by Dashboard's Upcoming Birthdays
 * section AND the full Birthdays page, so the "next occurrence" and
 * "age turning" logic can't drift between the two.
 */

/**
 * Given a dateOfBirth string, returns the member's NEXT birthday
 * occurrence (this year if it hasn't happened yet, otherwise next
 * year), how many days away it is, and what age they'll be turning.
 * Returns null if dateOfBirth is missing.
 */
export function getNextBirthday(dateOfBirth, today = new Date()) {
  if (!dateOfBirth) return null;

  const ref = new Date(today);
  ref.setHours(0, 0, 0, 0);

  const dob = new Date(dateOfBirth);
  let next = new Date(ref.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < ref) next = new Date(ref.getFullYear() + 1, dob.getMonth(), dob.getDate());

  const daysAway = Math.round((next - ref) / (1000 * 60 * 60 * 24));
  const turningAge = next.getFullYear() - dob.getFullYear();

  return { next, daysAway, turningAge };
}

/** Current age as of `today`, accounting for whether this year's birthday has passed. */
export function getCurrentAge(dateOfBirth, today = new Date()) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}
