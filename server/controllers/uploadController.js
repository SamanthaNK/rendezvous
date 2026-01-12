import {
    uploadMultipleImages,
    deleteMultipleImages,
    validateImageFiles,
} from '../services/cloudinaryService.js';

// Upload images
export const uploadEventImages = async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('req.files:', req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one image',
            });
        }

        console.log('Validating files...');
        validateImageFiles(req.files);

        console.log('Starting upload to Cloudinary...');
        const uploadedImages = await uploadMultipleImages(req.files, 'events');

        console.log('Upload successful:', uploadedImages);

        const imageUrls = uploadedImages.map(img => img.url);

        res.status(200).json({
            success: true,
            data: {
                urls: imageUrls,
                images: uploadedImages,
                count: uploadedImages.length,
            },
            message: 'Images uploaded successfully',
        });
    } catch (error) {
        console.error('Upload images error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload images',
        });
    }
};

// Delete images
export const deleteEventImages = async (req, res) => {
    try {
        const { publicIds } = req.body;

        if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of public IDs to delete',
            });
        }

        await deleteMultipleImages(publicIds);

        res.status(200).json({
            success: true,
            message: 'Images deleted successfully',
        });
    } catch (error) {
        console.error('Delete images error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete images',
        });
    }
};