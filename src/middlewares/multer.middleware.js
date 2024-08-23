import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) { //req conatins json data but file conatins file data.
      cb(null, './Public/temp') // 2nd argument is destination of the file. there is null value in 1st argumnet because we are not handling error here.
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // name of the file. file has different properties.
    }
  })
  const upload = multer({ storage: storage });
  
  export default upload;