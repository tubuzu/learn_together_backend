import * as cloudinary from 'cloudinary';
import { appSettings } from '../settings/app.setting.js';

cloudinary.v2.config({
    cloud_name: appSettings.CLOUDINARY_CLOUD_NAME as string,
    api_key: appSettings.CLOUDINARY_API_KEY as string,
    api_secret: appSettings.CLOUDINARY_API_SECRET as string,
});

export default cloudinary;