/** GraphQL operation strings for the S3 module (aligned with schema in generated/types). */

export const S3_FILES_LIST = `query S3FilesList($prefix: String) {
  s3 {
    s3Files(prefix: $prefix) {
      files { key filename size lastModified contentType }
      total
      bucketDisplayName
    }
  }
}`;

export const S3_DOWNLOAD_URL = `query S3DownloadUrl($fileKey: String!, $expiresIn: Int) {
  s3 {
    s3FileDownloadUrl(fileKey: $fileKey, expiresIn: $expiresIn) {
      downloadUrl
      expiresIn
    }
  }
}`;

export const S3_INITIATE_CSV_UPLOAD = `mutation InitCsv($input: InitiateCsvUploadInput!) {
  s3 {
    initiateCsvUpload(input: $input) {
      uploadId
      fileKey
      s3UploadId
      chunkSize
      numParts
    }
  }
}`;

export const S3_DELETE_FILE = `mutation S3DeleteFile($fileKey: String!) {
  s3 {
    deleteFile(fileKey: $fileKey)
  }
}`;

export const S3_COMPLETE_CSV_UPLOAD = `mutation CompleteCsvUpload($input: CompleteUploadInput!) {
  s3 {
    completeCsvUpload(input: $input) {
      fileKey
      s3Url
      status
      location
    }
  }
}`;

export const S3_FILE_DATA = `query S3FileData($fileKey: String!, $limit: Int, $offset: Int) {
  s3 {
    s3FileData(fileKey: $fileKey, limit: $limit, offset: $offset) {
      rows { data }
      totalRows
      limit
      offset
      fileKey
    }
  }
}`;

export const S3_FILE_INFO = `query S3FileInfo($fileKey: String!) {
  s3 {
    s3FileInfo(fileKey: $fileKey) {
      key
      filename
      size
      contentType
      lastModified
    }
  }
}`;

export const S3_FILE_SCHEMA = `query S3FileSchema($fileKey: String!) {
  s3 {
    s3FileSchema(fileKey: $fileKey) {
      name
      type
      nullable
    }
  }
}`;

export const S3_FILE_STATS = `query S3FileStats($fileKey: String!) {
  s3 {
    s3FileStats(fileKey: $fileKey) {
      rowCount
      columns
    }
  }
}`;

export const S3_BUCKET_METADATA = `query S3BucketMetadata {
  s3 {
    s3BucketMetadata
  }
}`;

export const S3_ABORT_UPLOAD = `mutation S3AbortUpload($input: AbortUploadInput!) {
  upload {
    abortUpload(input: $input) {
      status
      uploadId
    }
  }
}`;

export const S3_JOBS_LIST = `query S3JobsList($bucketId: String, $state: String) {
  s3 {
    s3Jobs(bucketId: $bucketId, state: $state) {
      jobs {
        id
        bucketId
        key
        state
        attempts
        createdAt
        updatedAt
      }
      total
      offset
      nextOffset
    }
  }
}`;
