import { pool } from '../../config/database.js';

export const saveImageToDatabase = async (userId, prompt, imageBase64) => {
  const query = `
    INSERT INTO generated_images (user_id, prompt, image_data, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, created_at;
  `;

  try {
    const result = await pool.query(query, [userId, prompt, imageBase64]);
    return {
      success: true,
      id: result.rows[0].id,
      created_at: result.rows[0].created_at
    };
  } catch (error) {
    console.error('Error saving image to database:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getImageFromDatabase = async (imageId) => {
  const query = `
    SELECT image_data, prompt, created_at
    FROM generated_images
    WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [imageId]);
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Image not found'
      };
    }
    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.error('Error retrieving image from database:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
