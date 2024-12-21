const { Client, Storage, ID } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

const appwriteUpload = {
    async saveImage(base64String) {
        let fileUrl;
        try {
            if (!base64String || typeof base64String !== 'string') {
                throw new Error('Invalid input: base64String is required and must be a string');
            }
            const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error('Invalid base64 string format');
            }

            const fileType = matches[1];
            const base64Data = matches[2];
            if (!fileType.startsWith('image/')) {
                throw new Error('Invalid file type: must be an image');
            }
            const extension = fileType.split('/')[1];
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

            const buffer = Buffer.from(base64Data, 'base64');
            const maxSize = 10 * 1024 * 1024;
            if (buffer.length > maxSize) {
                throw new Error(`File size exceeds maximum limit of ${maxSize} bytes`);
            }
            const file = InputFile.fromBuffer(buffer, fileName);
            const uniqueId = ID.unique();
            const result = await storage.createFile(
                process.env.APPWRITE_BUCKET_ID,
                uniqueId,
                file
            );
            fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${result.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
            return fileUrl;

        } catch (error) {
            console.error('❌ Upload error:', {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack,
                attemptedFileUrl: fileUrl
            });
            const envCheck = {
                hasEndpoint: !!process.env.APPWRITE_ENDPOINT,
                hasProjectId: !!process.env.APPWRITE_PROJECT_ID,
                hasApiKey: !!process.env.APPWRITE_API_KEY,
                hasBucketId: !!process.env.APPWRITE_BUCKET_ID
            };

            if (!Object.values(envCheck).every(Boolean)) {
                console.error('Missing required environment variables:',
                    Object.entries(envCheck)
                        .filter(([, value]) => !value)
                        .map(([key]) => key)
                );
            }

            throw error;
        }
    },

    async deleteImage(fileUrl) {
        if (!fileUrl) {
            console.log('⚠️ No file URL provided for deletion');
            return;
        }

        try {
            const urlParts = fileUrl.split('/files/');
            if (urlParts.length !== 2) {
                throw new Error('Invalid file URL format');
            }

            const fileId = urlParts[1].split('/view')[0];
            if (!fileId) {
                throw new Error('Could not extract file ID from URL');
            }

            await storage.deleteFile(
                process.env.APPWRITE_BUCKET_ID,
                fileId
            );
        } catch (error) {
            console.error('❌ Delete error:', {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack,
                fileUrl
            });
            throw error;
        }
    }
};

module.exports = appwriteUpload;