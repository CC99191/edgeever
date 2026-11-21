import type {
  BlobStoreAdapter,
  DatabaseAdapter,
  StorageAdapter,
} from "./storage-contract";
import { AppError } from "./app-error";

/** Native Worker bindings are mentioned only at this platform boundary. */
export type CloudflareStorageBindings = {
  DB: DatabaseAdapter;
  /** Optional so deployments can run core note features without attachments. */
  RESOURCES?: BlobStoreAdapter;
};

const unavailableObjectStorage = (): never => {
  throw new AppError(
    "object_storage_unavailable",
    "Object storage is not configured. Add an R2 binding or configure S3-compatible storage.",
    503,
  );
};

/**
 * Keeps the storage contract total while making attachment operations fail
 * closed when this instance intentionally runs without an R2 bucket.
 */
const disabledBlobStore: BlobStoreAdapter = {
  async get() {
    return unavailableObjectStorage();
  },
  async put() {
    return unavailableObjectStorage();
  },
  async createMultipartUpload() {
    return unavailableObjectStorage();
  },
  resumeMultipartUpload() {
    return unavailableObjectStorage();
  },
  async delete() {
    return unavailableObjectStorage();
  },
};

/**
 * Adapts native Cloudflare bindings to the storage surface consumed by the
 * application. No route or service should construct this shape directly.
 */
export const createCloudflareStorageAdapter = (
  bindings: CloudflareStorageBindings,
): StorageAdapter => ({
  db: bindings.DB,
  resources: bindings.RESOURCES ?? disabledBlobStore,
  diagnostics: {
    database: "d1",
    resources: "r2",
    migrationTable: "d1_migrations",
  },
});
