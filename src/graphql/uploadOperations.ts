/** GraphQL operations for `UploadQuery` / `UploadMutation` (gateway `upload` namespace). */

export const UPLOAD_INITIATE = `mutation InitiateUpload($input: InitiateUploadInput!) {
  upload {
    initiateUpload(input: $input) {
      uploadId
      fileKey
      chunkSize
      numParts
      s3UploadId
    }
  }
}`;

export const UPLOAD_REGISTER_PART = `mutation RegisterPart($input: RegisterPartInput!) {
  upload {
    registerPart(input: $input) {
      partNumber
      status
    }
  }
}`;

export const UPLOAD_COMPLETE = `mutation CompleteUpload($input: CompleteUploadInput!) {
  upload {
    completeUpload(input: $input) {
      fileKey
      s3Url
      status
      location
    }
  }
}`;

export const UPLOAD_ABORT = `mutation AbortUpload($input: AbortUploadInput!) {
  upload {
    abortUpload(input: $input) {
      uploadId
      status
    }
  }
}`;

export const UPLOAD_STATUS = `query UploadStatus($uploadId: String!) {
  upload {
    uploadStatus(uploadId: $uploadId) {
      uploadId
      status
      fileKey
      fileSize
      chunkSize
      totalParts
      uploadedParts
      uploadedBytes
    }
  }
}`;

export const UPLOAD_PRESIGNED_URL = `query GetPresignedUrl($uploadId: String!, $partNumber: Int!) {
  upload {
    presignedUrl(uploadId: $uploadId, partNumber: $partNumber) {
      presignedUrl
      partNumber
      alreadyUploaded
      etag
    }
  }
}`;
