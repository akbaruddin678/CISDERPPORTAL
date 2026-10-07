// The client below reads its credentials when this module loads — ES imports run
// before server.js calls dotenv.config(), so load .env here too or a local run
// (where the values only live in .env) creates a client with no credentials.
import "dotenv/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

// Cloudflare R2 configuration
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToR2 = async (file, folder = "admissions") => {
  try {
    const key = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${path.extname(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Use the custom MEDIA_URL from environment variables
    return `${process.env.MEDIA_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};

export const deleteFromR2 = async (key) => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
    );
  } catch (error) {
    // Non-fatal — the DB record is the source of truth; a leftover R2
    // object costs storage but never breaks anything the app reads.
    console.error("Error deleting from R2:", error);
  }
};

export default s3Client;