import { Router } from "express";
import registerUser from "../controllers/User.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), // .fields enables multiple file uploads.
    registerUser)  //url- http://localhost:8000/api/v1/users/register

export default router;