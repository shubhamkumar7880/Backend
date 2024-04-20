import { Router } from "express";
import registerUser from "../controllers/User.controller.js";

const router = Router();

router.route("/register").post(registerUser)  //url- http://localhost:8000/api/v1/users/register

export default router;