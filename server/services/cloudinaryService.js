import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Lazy configuration (only runs once on first use)
let isConfigured = false;

const ensureCloudinaryConfig = () => {
    if (!isConfigured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        isConfigured = true;
    }
};

// Upload single image from buffer
export const uploadImage = async (buffer, folder = 'events') => {
    ensureCloudinaryConfig();

    if (!buffer) {
        throw new Error('Buffer is required for image upload');
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `rendezvous/${folder}`,
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto:good' },
                ],
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );

        try {
            const readableStream = Readable.from(buffer);
            readableStream.pipe(uploadStream);
        } catch (streamError) {
            console.error('Stream error:', streamError);
            reject(streamError);
        }
    });
};

// Upload multiple images
export const uploadMultipleImages = async (files, folder = 'events') => {
    ensureCloudinaryConfig();

    if (!files || files.length === 0) {
        throw new Error('No files provided');
    }

    try {
        const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Upload multiple images error:', error.message);
        throw new Error(`Failed to upload images: ${error.message}`);
    }
};

// Delete single image
export const deleteImage = async (publicId) => {
    ensureCloudinaryConfig();

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
    }
};

// Delete multiple images
export const deleteMultipleImages = async (publicIds) => {
    ensureCloudinaryConfig();

    try {
        const deletePromises = publicIds.map((publicId) => deleteImage(publicId));
        const results = await Promise.all(deletePromises);
        return results;
    } catch (error) {
        throw new Error(`Failed to delete images: ${error.message}`);
    }
};

// Validate image file
export const validateImageFile = (file) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Only JPG and PNG images are allowed');
    }

    if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
    }

    return true;
};

// Validate multiple image files
export const validateImageFiles = (files) => {
    if (!files || files.length === 0) {
        throw new Error('At least one image is required');
    }

    if (files.length > 5) {
        throw new Error('Maximum 5 images allowed');
    }

    files.forEach((file) => validateImageFile(file));

    return true;
};