import { ImageStorageService } from '../image/imageStorageService';

export class ProfileImageService {
  static async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const filename = `${userId}/profile-image.${fileExt}`;
      
      // Convert File to Blob
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      
      // Use the base ImageStorageService to handle the upload
      const imagePath = await ImageStorageService.uploadImage(blob, filename);
      
      return imagePath;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error('Failed to upload profile image');
    }
  }
}
