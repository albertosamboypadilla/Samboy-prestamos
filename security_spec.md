# Security Specification for PrestaFlow

## Data Invariants
1. A loan document cannot be created with a status other than 'pending'.
2. Only the client who owns the loan can view its details (unless the user is an admin).
3. A payment must always reference a valid loan ID.
4. Users cannot modify their own roles in the `users` collection.
5. Once a loan is 'closed' or 'rejected', no further modifications are allowed.

## The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Malicious ID**: Attempt to create a loan with an ID that is 2KB long.
2. **Role Escalation**: Client attempts to update their `role` to 'admin'.
3. **Identity Spoofing**: User A attempts to create a loan with User B's `clientId`.
4. **Status Shortcut**: Client attempts to create a loan with status 'approved'.
5. **State Corruption**: Client attempts to update `amount` after loan is 'approved'.
6. **Orphaned Payment**: Create a payment for a loan ID that does not exist.
7. **Ghost Fields**: Add `isVerified: true` to a loan document via update.
8. **PII Leak**: Non-admin user attempts to list all users.
9. **Negative Interest**: Create a loan with `-5%` interest rate.
10. **Zero Term**: Create a loan with `0` months term.
11. **Spoofed Admin**: Create a document in a restricted path pretending to be a system admin.
12. **Double Signing**: Attempt to change `signatureStatus` after it is already 'signed'.

## Test Runner (Logic Check)
The `firestore.rules` will be tested against these payloads to ensure `PERMISSION_DENIED`.
