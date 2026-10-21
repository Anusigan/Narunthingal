// Add all admin IIT email addresses here.
// These users will see the admin portal after signing in.
export const ADMIN_EMAILS: string[] = [
  // e.g. "yourname.20230001@iit.ac.lk",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(
    email.toLowerCase()
  );
}
