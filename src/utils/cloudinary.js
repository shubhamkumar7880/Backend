import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });

    console.log('File has been uploaded successfully', response.url);
    try {
      fs.unlinkSync(localFilePath);
      console.log('Local file deleted successfully');
    } catch (err) {
      console.error('Error while deleting the file:', err);
    }
    return response;
  } catch (err) {
    try {
      fs.unlinkSync(localFilePath); // remove the locally saved temporaray file as the uplaod operation got failed
    } catch (unlinkErr) {
      console.error('Error while deleting the file after failure:', unlinkErr);
    }
    console.error('Upload failed', err);
    return null;
  }
};
const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return null;
    const parts = fileUrl.split('/');
    const fileName = parts.pop().split('.')[0]; // remove extension
    const folderPath = parts.slice(7).join('/'); // skip domain, resource_type, upload, version
    const publicId = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Call Cloudinary delete API
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('File deleted successfully from Cloudinary:', result);
    return result;
  } catch (err) {
    console.error('Error deleting file from Cloudinary:', err);
    return null;
  }
};
export { deleteFromCloudinary, uploadOnCloudinary }; // export the function uploadOnCloudinary;
