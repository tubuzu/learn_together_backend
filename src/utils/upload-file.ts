import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../config/firebase.config.js";

export const uploadFile = async (file: any, filePath: string) => {
  try {
    const dateTime = giveCurrentDateTime();

    const storageRef = ref(
      storage,
      `${filePath}/${dateTime + "___" + file.originalname}`
    );

    // Create file metadata including the content type
    const metadata = {
      contentType: file.mimetype,
    };

    // Upload the file in the bucket storage
    const url = await uploadBytesResumable(
      storageRef,
      file.buffer,
      metadata
    ).then(async (snapshot) => {
      return await getDownloadURL(snapshot.ref).then((url) => url);
    });

    return url;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + " " + time;
  return dateTime;
};
