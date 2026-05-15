# Multipart upload modules

Canonical implementation lives under **`src/lib/multipart/`**:

| File                | Role                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `types.ts`          | `TabularMultipartProgressCallback` and part info types                                                      |
| `presignedParts.ts` | `uploadPresignedMultipartParts` / `uploadCsvMultipartParts` — shared PUT + `registerPart` loop              |
| `gatewayUpload.ts`  | `uploadFileViaUploadModule` — full `upload.initiateUpload` → parts → `completeUpload` with abort on failure |
| `index.ts`          | Barrel re-exports                                                                                           |

Legacy entry points at the `src/lib/` root (`multipartCsvUpload.ts`, `multipartGatewayUpload.ts`, `multipartUploadTypes.ts`) are thin **re-exports** for backward compatibility; new code should import from `@/lib/multipart`.
