"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useS3Files } from "@/hooks/useS3Files";
import { useRole } from "@/context/RoleContext";
import { jobsService } from "@/services/graphql/jobsService";
import {
  formatFileSize,
  formatRelativeTime,
  normalizeS3FileSizeBytes,
} from "@/lib/utils";
import { isAllowedTabularFilename } from "@/lib/tabularUpload";
import type { FinderColumnMap } from "@/lib/emailCsv";
import type {
  CreateContact360ImportInput,
  S3FileInfo,
} from "@/graphql/generated/types";
import { toast } from "sonner";
import { parseEmailServiceError } from "@/lib/emailErrors";
import { normalizeExportOutputPrefix } from "@/lib/jobs/exportOutputPrefix";

export type StartJobFromS3JobKind =
  | "email_finder"
  | "email_verify"
  | "email_pattern"
  | "import_contact"
  | "import_company";

export interface StartJobFromS3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: () => void;
  initialFile?: S3FileInfo | null;
  /** When set on open, pre-fills email finder column headers (e.g. from Bulk Finder wizard). */
  initialFinderColumnMap?: FinderColumnMap | null;
  /** When `email_verify`, opens on Email verify (bulk) with optional column/provider (e.g. from Bulk Verifier). */
  initialJobKind?: StartJobFromS3JobKind;
  initialVerifyEmailColumn?: string;
  initialVerifyProvider?: string;
}

const EMAIL_KINDS: { value: StartJobFromS3JobKind; label: string }[] = [
  { value: "email_finder", label: "Email finder (bulk)" },
  { value: "email_verify", label: "Email verify (bulk)" },
  { value: "email_pattern", label: "Email pattern learn (S3)" },
];

const IMPORT_KINDS: { value: StartJobFromS3JobKind; label: string }[] = [
  { value: "import_contact", label: "Import contacts (Connectra)" },
  { value: "import_company", label: "Import companies (Connectra)" },
];

const VERIFY_PROVIDERS = [
  { value: "mailtester", label: "mailtester" },
  { value: "truelist", label: "truelist" },
  { value: "icypeas", label: "icypeas" },
  { value: "mailvetter", label: "mailvetter" },
];

function ColumnMapField({
  label,
  placeholder,
  value,
  onChange,
  schemaNames,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  schemaNames: string[];
  disabled?: boolean;
}) {
  const quickValue = schemaNames.includes(value) ? `pick:${value}` : "";
  const quickOptions = useMemo(
    () => [
      { value: "", label: "Quick pick from schema…" },
      ...schemaNames.map((n) => ({ value: `pick:${n}`, label: n })),
    ],
    [schemaNames],
  );

  return (
    <div className="c360-field">
      <span className="c360-label">{label}</span>
      <div className="c360-flex c360-flex-col c360-gap-2 md:c360-flex-row md:c360-items-end">
        <Select
          options={quickOptions}
          value={quickValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith("pick:")) onChange(v.slice(5));
          }}
          disabled={disabled || schemaNames.length === 0}
          fullWidth
          className="md:c360-min-w-[11rem]"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function StartJobFromS3Modal({
  isOpen,
  onClose,
  onJobCreated,
  initialFile = null,
  initialFinderColumnMap = null,
  initialJobKind,
  initialVerifyEmailColumn,
  initialVerifyProvider,
}: StartJobFromS3ModalProps) {
  const { isSuperAdmin } = useRole();
  const { files, bucketName, loading, error, refresh, getFileSchema } =
    useS3Files(undefined);
  const [jobKind, setJobKind] = useState<StartJobFromS3JobKind>("email_finder");
  const [selectedKey, setSelectedKey] = useState(() => initialFile?.key ?? "");
  const [outputPrefix, setOutputPrefix] = useState("exports/");
  const [importBucket, setImportBucket] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [schemaNames, setSchemaNames] = useState<string[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [finderFirstName, setFinderFirstName] = useState("first_name");
  const [finderLastName, setFinderLastName] = useState("last_name");
  const [finderDomain, setFinderDomain] = useState("domain");
  const [verifyEmailCol, setVerifyEmailCol] = useState("Email");
  const [verifyProvider, setVerifyProvider] = useState("mailtester");
  const [patternCompanyUuid, setPatternCompanyUuid] = useState("company_uuid");
  const [patternEmail, setPatternEmail] = useState("email");
  const [patternFirstName, setPatternFirstName] = useState("first_name");
  const [patternLastName, setPatternLastName] = useState("last_name");
  const [patternDomain, setPatternDomain] = useState("domain");
  const [importLinkedinCol, setImportLinkedinCol] = useState("");
  const [importCsvColumnsJson, setImportCsvColumnsJson] = useState("{}");

  const resetMappings = useCallback(() => {
    setFinderFirstName("first_name");
    setFinderLastName("last_name");
    setFinderDomain("domain");
    setVerifyEmailCol("Email");
    setVerifyProvider("mailtester");
    setPatternCompanyUuid("company_uuid");
    setPatternEmail("email");
    setPatternFirstName("first_name");
    setPatternLastName("last_name");
    setPatternDomain("domain");
    setImportLinkedinCol("");
    setImportCsvColumnsJson("{}");
  }, []);

  const kindOptions = useMemo(
    () => (isSuperAdmin ? [...EMAIL_KINDS, ...IMPORT_KINDS] : EMAIL_KINDS),
    [isSuperAdmin],
  );

  useEffect(() => {
    if (!isOpen) return;
    void refresh();
    setSelectedKey(initialFile?.key ?? "");
    setOutputPrefix("exports/");
    setImportBucket("");
    resetMappings();
    const resolvedKind: StartJobFromS3JobKind =
      initialJobKind === "email_verify" ? "email_verify" : "email_finder";
    setJobKind(resolvedKind);
    if (resolvedKind === "email_verify") {
      const col = (initialVerifyEmailColumn ?? "Email").trim();
      setVerifyEmailCol(col || "Email");
      setVerifyProvider(initialVerifyProvider ?? "mailtester");
    } else if (initialFinderColumnMap) {
      setFinderFirstName(initialFinderColumnMap.firstName);
      setFinderLastName(initialFinderColumnMap.lastName);
      setFinderDomain(initialFinderColumnMap.domain);
    }
  }, [
    isOpen,
    refresh,
    initialFile?.key,
    resetMappings,
    initialFinderColumnMap,
    initialJobKind,
    initialVerifyEmailColumn,
    initialVerifyProvider,
  ]);

  useEffect(() => {
    if (!isOpen || !bucketName) return;
    if (jobKind === "import_contact" || jobKind === "import_company") {
      setImportBucket((prev) => prev || bucketName);
    }
  }, [isOpen, bucketName, jobKind]);

  useEffect(() => {
    if (
      !isSuperAdmin &&
      (jobKind === "import_contact" || jobKind === "import_company")
    ) {
      setJobKind("email_finder");
    }
  }, [isSuperAdmin, jobKind]);

  useEffect(() => {
    if (!isOpen || !selectedKey.trim()) {
      setSchemaNames([]);
      setSchemaError(null);
      setSchemaLoading(false);
      return;
    }
    let cancelled = false;
    setSchemaLoading(true);
    setSchemaError(null);
    void getFileSchema(selectedKey.trim())
      .then((cols) => {
        if (!cancelled) setSchemaNames(cols.map((c) => c.name).filter(Boolean));
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSchemaNames([]);
          setSchemaError(
            e instanceof Error ? e.message : "Could not load file schema",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSchemaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedKey, getFileSchema]);

  const sortedFiles = useMemo(
    () =>
      [...files].sort((a, b) =>
        (a.filename || a.key).localeCompare(b.filename || b.key, undefined, {
          sensitivity: "base",
        }),
      ),
    [files],
  );

  const filesForPicker = useMemo(() => {
    const k = initialFile?.key;
    if (!k) return sortedFiles;
    if (sortedFiles.some((f) => f.key === k)) return sortedFiles;
    return [...sortedFiles, initialFile].sort((a, b) =>
      (a.filename || a.key).localeCompare(b.filename || b.key, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sortedFiles, initialFile]);

  const fileOptions = useMemo(
    () =>
      filesForPicker.map((f) => ({
        value: f.key,
        label: f.filename || f.key,
      })),
    [filesForPicker],
  );

  const listMatch = useMemo(
    () => filesForPicker.find((f) => f.key === selectedKey) ?? null,
    [filesForPicker, selectedKey],
  );

  const isImport = jobKind === "import_contact" || jobKind === "import_company";
  const isEmailFinder = jobKind === "email_finder";
  const isEmailVerify = jobKind === "email_verify";
  const isEmailPattern = jobKind === "email_pattern";

  const tabularOk =
    !listMatch || isAllowedTabularFilename(listMatch.filename || "");

  const buildImportCsvColumns =
    (): CreateContact360ImportInput["csvColumns"] => {
      let extra: Record<string, unknown> = {};
      const raw = importCsvColumnsJson.trim();
      if (raw && raw !== "{}") {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            extra = { ...parsed } as Record<string, unknown>;
          } else {
            throw new Error("csv_columns JSON must be an object.");
          }
        } catch (e) {
          throw new Error(
            e instanceof Error ? e.message : "Invalid csv_columns JSON",
          );
        }
      }
      const li = importLinkedinCol.trim();
      if (li) extra.linkedin_url_column = li;
      return Object.keys(extra).length > 0 ? extra : undefined;
    };

  const handleSubmit = async () => {
    if (!selectedKey.trim()) {
      toast.error("Set the S3 object key.");
      return;
    }
    if (!isImport && !outputPrefix.trim()) {
      toast.error("Set an output prefix.");
      return;
    }
    if (isImport) {
      if (!importBucket.trim()) {
        toast.error("S3 bucket is required for import jobs.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const bucket = bucketName?.trim() || undefined;
      let exportPrefix: string | undefined;
      if (
        jobKind === "email_finder" ||
        jobKind === "email_verify" ||
        jobKind === "email_pattern"
      ) {
        try {
          exportPrefix = normalizeExportOutputPrefix(outputPrefix);
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Invalid S3 output prefix.",
          );
          setSubmitting(false);
          return;
        }
      }
      if (jobKind === "email_finder") {
        await jobsService.createEmailFinderExport({
          inputCsvKey: selectedKey.trim(),
          outputPrefix: exportPrefix!,
          ...(bucket ? { s3Bucket: bucket } : {}),
          csvColumns: {
            firstName: finderFirstName.trim() || "first_name",
            lastName: finderLastName.trim() || "last_name",
            domain: finderDomain.trim() || "domain",
          },
        });
      } else if (jobKind === "email_verify") {
        await jobsService.createEmailVerifyExport({
          inputCsvKey: selectedKey.trim(),
          outputPrefix: exportPrefix!,
          ...(bucket ? { s3Bucket: bucket } : {}),
          provider: verifyProvider || undefined,
          csvColumns: {
            email: verifyEmailCol.trim() || "Email",
          },
        });
      } else if (jobKind === "email_pattern") {
        await jobsService.createEmailPatternExport({
          inputCsvKey: selectedKey.trim(),
          outputPrefix: exportPrefix!,
          ...(bucket ? { s3Bucket: bucket } : {}),
          csvColumns: {
            companyUuid: patternCompanyUuid.trim() || "company_uuid",
            email: patternEmail.trim() || "email",
            firstName: patternFirstName.trim() || "first_name",
            lastName: patternLastName.trim() || "last_name",
            domain: patternDomain.trim() || "domain",
          },
        });
      } else if (jobKind === "import_contact") {
        const csvColumns = buildImportCsvColumns();
        const res = await jobsService.createContact360Import({
          s3Bucket: importBucket.trim(),
          s3Key: selectedKey.trim(),
          importTarget: "contact",
          outputPrefix: outputPrefix.trim() || undefined,
          ...(csvColumns ? { csvColumns } : {}),
        });
        toast.success(
          `Import job ${res.jobs.createContact360Import.jobId} started`,
        );
      } else {
        const csvColumns = buildImportCsvColumns();
        const res = await jobsService.createContact360Import({
          s3Bucket: importBucket.trim(),
          s3Key: selectedKey.trim(),
          importTarget: "company",
          outputPrefix: outputPrefix.trim() || undefined,
          ...(csvColumns ? { csvColumns } : {}),
        });
        toast.success(
          `Import job ${res.jobs.createContact360Import.jobId} started`,
        );
      }

      if (
        jobKind === "email_finder" ||
        jobKind === "email_verify" ||
        jobKind === "email_pattern"
      ) {
        toast.success("Email job created successfully.");
      }
      onJobCreated?.();
      onClose();
    } catch (e) {
      toast.error(parseEmailServiceError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start job from S3 file"
      size="lg"
    >
      <div className="c360-section-stack">
        {isImport && (
          <Alert variant="info" title="SuperAdmin — Connectra import">
            Uses{" "}
            <code className="c360-text-xs">jobs.createContact360Import</code>{" "}
            with <code className="c360-text-xs">s3Bucket</code>,{" "}
            <code className="c360-text-xs">s3Key</code>, optional{" "}
            <code className="c360-text-xs">csvColumns</code> JSON for column
            mapping.
          </Alert>
        )}
        {error && (
          <Alert variant="danger" title="Could not list files">
            {error}
          </Alert>
        )}
        <Select
          label="Job type"
          value={jobKind}
          onChange={(e) => setJobKind(e.target.value as StartJobFromS3JobKind)}
          options={kindOptions}
        />
        <Select
          label="S3 file"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          options={fileOptions}
          placeholder={loading ? "Loading files…" : "Choose a file…"}
          disabled={fileOptions.length === 0}
        />
        {!loading && fileOptions.length === 0 && (
          <p className="c360-text-xs c360-text-muted">
            No files yet.{" "}
            <Link href="/files" className="c360-text-primary">
              Open Files to upload
            </Link>
            .
          </p>
        )}
        <Input
          label="S3 object key (payload: inputCsvKey / s3Key)"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          placeholder="upload/example.csv"
          helperText="Filled from the file you pick; edit if the gateway expects a different logical key."
        />
        {listMatch ? (
          <div className="c360-card c360-p-3 c360-text-sm">
            <p className="c360-font-medium c360-mb-2">File metadata (list)</p>
            <dl className="c360-job-detail-grid">
              <div>
                <dt>Name</dt>
                <dd>{listMatch.filename || "—"}</dd>
              </div>
              <div className="c360-job-detail-full">
                <dt>Key</dt>
                <dd className="c360-font-mono c360-text-xs">{listMatch.key}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>
                  {formatFileSize(normalizeS3FileSizeBytes(listMatch.size))}
                </dd>
              </div>
              <div>
                <dt>Content type</dt>
                <dd>{listMatch.contentType || "—"}</dd>
              </div>
              <div>
                <dt>Last modified</dt>
                <dd>
                  {listMatch.lastModified
                    ? formatRelativeTime(listMatch.lastModified)
                    : "—"}
                </dd>
              </div>
            </dl>
            {!tabularOk && (
              <p className="c360-text-xs c360-text-muted c360-mt-2">
                This name does not look like CSV/TSV/Excel — email and import
                jobs usually expect tabular data.
              </p>
            )}
          </div>
        ) : selectedKey.trim() ? (
          <p className="c360-text-xs c360-text-muted">
            No matching row in the current file list for this key — metadata
            above is unavailable; schema fetch still uses this key.
          </p>
        ) : null}

        {isEmailFinder && (
          <div className="c360-card c360-p-3 c360-text-sm c360-section-stack">
            <p className="c360-font-medium">
              CSV column mapping →{" "}
              <code className="c360-text-xs">csv_columns</code> (finder)
            </p>
            {schemaLoading && (
              <p className="c360-text-xs c360-text-muted">Loading schema…</p>
            )}
            {schemaError && (
              <Alert variant="info" title="Schema unavailable">
                {schemaError}. You can still type header names manually.
              </Alert>
            )}
            <ColumnMapField
              label="First name column"
              placeholder="first_name"
              value={finderFirstName}
              onChange={setFinderFirstName}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <ColumnMapField
              label="Last name column"
              placeholder="last_name"
              value={finderLastName}
              onChange={setFinderLastName}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <ColumnMapField
              label="Domain column"
              placeholder="domain"
              value={finderDomain}
              onChange={setFinderDomain}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
          </div>
        )}

        {isEmailPattern && (
          <div className="c360-card c360-p-3 c360-text-sm c360-section-stack">
            <p className="c360-font-medium">
              CSV column mapping →{" "}
              <code className="c360-text-xs">csv_columns</code> (pattern learn)
            </p>
            {schemaLoading && (
              <p className="c360-text-xs c360-text-muted">Loading schema…</p>
            )}
            {schemaError && (
              <Alert variant="info" title="Schema unavailable">
                {schemaError}. You can still type header names manually.
              </Alert>
            )}
            <ColumnMapField
              label="Company UUID column"
              placeholder="company_uuid"
              value={patternCompanyUuid}
              onChange={setPatternCompanyUuid}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <ColumnMapField
              label="Email column"
              placeholder="email"
              value={patternEmail}
              onChange={setPatternEmail}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <ColumnMapField
              label="First name column"
              placeholder="first_name"
              value={patternFirstName}
              onChange={setPatternFirstName}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <ColumnMapField
              label="Last name column"
              placeholder="last_name"
              value={patternLastName}
              onChange={setPatternLastName}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <ColumnMapField
              label="Domain column"
              placeholder="domain"
              value={patternDomain}
              onChange={setPatternDomain}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
          </div>
        )}

        {isEmailVerify && (
          <div className="c360-card c360-p-3 c360-text-sm c360-section-stack">
            <p className="c360-font-medium">
              CSV column mapping →{" "}
              <code className="c360-text-xs">csv_columns.email</code> (verify)
            </p>
            {schemaLoading && (
              <p className="c360-text-xs c360-text-muted">Loading schema…</p>
            )}
            {schemaError && (
              <Alert variant="info" title="Schema unavailable">
                {schemaError}. You can still type the email header manually.
              </Alert>
            )}
            <ColumnMapField
              label="Email column"
              placeholder="Email"
              value={verifyEmailCol}
              onChange={setVerifyEmailCol}
              schemaNames={schemaNames}
              disabled={schemaLoading}
            />
            <Select
              label="Verify provider"
              value={verifyProvider}
              onChange={(e) => setVerifyProvider(e.target.value)}
              options={VERIFY_PROVIDERS}
            />
          </div>
        )}

        {isImport && (
          <>
            <Input
              label="S3 bucket (logical) *"
              value={importBucket}
              onChange={(e) => setImportBucket(e.target.value)}
              placeholder={bucketName ?? "Workspace bucket id"}
              helperText={
                bucketName
                  ? `Default from listing: ${bucketName}`
                  : "Loaded when the file list succeeds."
              }
            />
            <div className="c360-card c360-p-3 c360-text-sm c360-section-stack">
              <p className="c360-font-medium">
                Import <code className="c360-text-xs">csv_columns</code> (JSON +
                LinkedIn)
              </p>
              {schemaLoading && (
                <p className="c360-text-xs c360-text-muted">Loading schema…</p>
              )}
              {schemaError && (
                <Alert variant="info" title="Schema unavailable">
                  {schemaError}. LinkedIn column can still be typed manually.
                </Alert>
              )}
              <ColumnMapField
                label="LinkedIn URL column → linkedin_url_column"
                placeholder="person_linkedin_url"
                value={importLinkedinCol}
                onChange={setImportLinkedinCol}
                schemaNames={schemaNames}
                disabled={schemaLoading}
              />
              <div className="c360-field">
                <label className="c360-label" htmlFor="c360-import-csv-json">
                  Extra csv_columns (JSON object)
                </label>
                <textarea
                  id="c360-import-csv-json"
                  className="c360-input c360-font-mono"
                  rows={4}
                  value={importCsvColumnsJson}
                  onChange={(e) => setImportCsvColumnsJson(e.target.value)}
                  placeholder='{"custom_key": "Header In CSV"}'
                />
                <span className="c360-input-helper">
                  Merged with LinkedIn mapping; must be a single JSON object.
                </span>
              </div>
            </div>
          </>
        )}

        <Input
          label={isImport ? "Output prefix (optional)" : "Output prefix *"}
          value={outputPrefix}
          onChange={(e) => setOutputPrefix(e.target.value)}
          placeholder="exports/"
        />
        {!isImport && (
          <p className="c360-text-xs c360-text-muted c360-mb-1">
            Exports are stored under{" "}
            <code className="c360-font-mono">exports/</code> in your user
            bucket; values are normalized on create (same rules as the API).
          </p>
        )}
        <p className="c360-text-xs c360-text-muted">
          Request payloads include the S3 key above, output prefix, and column
          maps as sent to email.server (finder/verify/pattern) or Connectra{" "}
          <code className="c360-text-xs">insert_csv_file</code>.
        </p>
        <div className="c360-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={submitting}
            leftIcon={<Play size={14} />}
            onClick={() => void handleSubmit()}
            disabled={!selectedKey.trim()}
          >
            Start job
          </Button>
        </div>
      </div>
    </Modal>
  );
}
