import multer from "multer";
import path from "path";
import util from "util";

const maxSize = 10 * 1024 * 1024;

let processDocumentFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
}).fields([
  {
    name: "documents",
    maxCount: 5,
  },
]);

let processUserFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext != ".gif") {
      cb(null, false);
      return;
    }
    cb(null, true);
  },
}).fields([
  {
    name: "avatar",
    maxCount: 1,
  },
  {
    name: "background",
    maxCount: 1,
  },
]);

let processImageAttachmentFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext != ".gif") {
      cb(null, false);
      return;
    }
    cb(null, true);
  },
}).fields([
  {
    name: "attachments",
    maxCount: 5,
  },
]);

export const processUserFileMiddleware = util.promisify(processUserFile);
export const processDocumentFileMiddleware =
  util.promisify(processDocumentFile);
export const processImageAttachmentFileMiddleware = util.promisify(
  processImageAttachmentFile
);
