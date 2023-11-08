import multer from "multer";
import util from "util";

const maxSize = 10 * 1024 * 1024;

let processFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
  // fileFilter: (req, file, cb) => {
  //     let ext = path.extname(file.originalname);
  //     if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext != ".gif") {
  //         cb(null, false);
  //         return;
  //     }
  //     cb(null, true);
  // },
}).fields([
  {
    name: "documents",
    maxCount: 5,
  },
  {
    name: "avatar",
    maxCount: 1,
  },
  {
    name: "background",
    maxCount: 1,
  },
]);

export let processFileMiddleware = util.promisify(processFile);
