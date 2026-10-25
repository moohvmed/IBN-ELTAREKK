# Security Specification - IBN ELTAREK Tutoring Center

## 1. Data invariants enforced by the current rules and API

1. A user can read their own `/users/{uid}` profile. Tutor accounts can read profiles.
2. A student can create only their own profile, with their own UID and the `student` role.
3. Self-service profile edits are limited to `name`, `avatar`, `phone`, and `specializationOrGrade`. The profile ID and role cannot be changed by the account owner.
4. Parent-to-student links are not self-editable. Keep tutor profile creation and edits restricted to trusted staff.
5. Firestore client access to grades, attendance, content, and registration requests is denied; application access goes through authenticated Cloud Functions routes.
6. The API verifies Firebase ID tokens, validates record IDs and input fields, and limits grade/attendance writes to tutor profiles.
7. Students and linked parents can read only their own grades and attendance through the API. Tutors can read center records.

## 2. Verification notes

- Firestore rules use `diff(...).affectedKeys().hasOnly(...)` for self-service profile updates.
- Cloud Functions validate incoming request values and enforce role checks server-side.
- These rules and API checks must still be exercised against the Firebase emulators before production deployment.
