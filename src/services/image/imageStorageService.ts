import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

export class ImageStorageService {
  static async uploadImage(blob: Blob, filename: string): Promise<string> {
    try {
      // Ensure upload directory exists
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Generate unique filename
      const uniqueFilename = `${uuidv4()}-${filename}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);

      // Convert blob to buffer and save
      const buffer = Buffer.from(await blob.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // Return public URL
      return `/uploads/${uniqueFilename}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  static async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(UPLOAD_DIR, path.basename(filename));
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
}
