const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadFile = async (fileBuffer, metadata, publicId = null) => {
  try {
    const validatedMetadata = Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [key, value?.toString() || ""])
    );

    return new Promise((resolve, reject) => {
      const options = {
        resource_type: "raw",
        context: validatedMetadata,
        tags: validatedMetadata,
        public_id: publicId || `certificates_${validatedMetadata.studentId}-${Date.now()}`, 
        overwrite: true,
      };

      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error("Cloudinary uploadFile error:", error);
    throw error;
  }
};

exports.getResource = async (secureUrl) => {
  try {
    const publicId = secureUrl
      .split("/")
      .slice(-2)
      .join("/")
      .replace(/\.[^/.]+$/, "");

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
      context: true,
    });
    return resource;
  } catch (error) {
    console.error("Cloudinary get resource error:", error);
    throw error;
  }
};

exports.deleteResource = async (publicId) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });
    return response;
  } catch (error) {
    console.error("Cloudinary delete resource error:", error);
    throw error;
  }
};