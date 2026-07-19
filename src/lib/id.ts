/**
 * Normalizes an employee ID to a single canonical form so that "emp-001",
 * "EMP001", and " Emp 001 " are all treated as the same employee.
 *
 * Rule: trim whitespace, uppercase, strip anything that isn't a letter or digit.
 */
export function normalizeEmployeeId(id: string): string {
  return id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
