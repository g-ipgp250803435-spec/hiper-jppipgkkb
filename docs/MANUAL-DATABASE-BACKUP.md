# Manual Production Database Backup Guide

This document explains how system administrators can manually create and download a logical backup of the HiPER production Supabase database prior to executing database migrations or maintenance tasks.

---

## Important Notice & Operator Responsibility

> ⚠️ **CRITICAL:** A successful GitHub Actions workflow run is **NOT** enough!
> You **MUST** actually download and verify the backup artifact onto secure private administrator storage **BEFORE** applying any new production migration or schema change. Artifacts are automatically retained on GitHub Actions for only **7 days** and contain private student/application data.

---

## Step-by-Step Backup Instructions

Follow these simple steps whenever a manual backup of the production database is needed:

1. **Navigate to GitHub Repository**
   Open the HiPER production repository in your web browser.

2. **Access the Actions Tab**
   Click on the **Actions** tab located at the top navigation bar of the repository.

3. **Select the Backup Workflow**
   In the left sidebar under "Workflows", select **"Manual Production Database Backup"**.

4. **Trigger the Workflow**
   Click the **"Run workflow"** dropdown button on the right side, leave the branch as `main` (or default), and click the green **"Run workflow"** button.

5. **Wait for Completion**
   Wait approximately 1–2 minutes for the workflow run to complete successfully (green checkmark).

6. **Open the Completed Run**
   Click on the completed workflow run (e.g. *"Manual Production Database Backup #X"*).

7. **Download the Backup Artifact**
   Scroll down to the **Artifacts** section at the bottom of the run summary page and click **`hiper-db-backup-[RUN_ID]`** to download the `.zip` archive.

8. **Secure Storage**
   Store the downloaded `.zip` file securely on an encrypted administrator drive or private local storage. **NEVER** share, publish, or commit the backup file publicly.

9. **Verify Artifact Contents**
   Extract the downloaded `.zip` archive and confirm it contains all five required files:
   - `roles.sql` (PostgreSQL roles and grants)
   - `schema.sql` (DDL schema structure and table definitions)
   - `data.sql` (Table record data dump)
   - `BACKUP-MANIFEST.txt` (Backup run metadata and timestamps)
   - `SHA256SUMS.txt` (SHA-256 integrity checksums for all files)

---

## Integrity Checksum Verification

To verify that the backup files have not been corrupted during download, run the following command inside the unzipped directory:

```bash
sha256sum -c SHA256SUMS.txt
```

Expected output:
```
roles.sql: OK
schema.sql: OK
data.sql: OK
BACKUP-MANIFEST.txt: OK
```

---

## Backup Scope & Technical Limitations

Please be aware of the following scope limitations when using this workflow:

1. **Supabase-Managed Schemas:** Supabase CLI logical dumps (`supabase db dump`) focus on public and custom schemas. Managed infrastructure schemas (such as `auth` or `storage` metadata) may be excluded by the Supabase CLI.
2. **Supabase Storage Files:** Actual binary files (e.g. uploaded images, PDF documents, receipts) stored in Supabase Storage buckets are **NOT** included in this SQL database dump.
3. **Restoration Testing:** Before attempting to restore any SQL dump, **ALWAYS** test the restoration against a separate, isolated development or staging Supabase project first. Never attempt an untested restore directly on production.
