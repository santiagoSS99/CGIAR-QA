import { Router } from "express";
import AuthController from "@controllers/AuthController";
import { checkJwt } from "@middlewares/checkJwt";
// import * as checkJwt from "@middlewares/checkJwt";
// import { checkJwt } from "../middlewares/checkJwt";

const router = Router();
//Login route
router.post("/login", AuthController.login);

//Change my password
router.post("/change-password", [checkJwt], AuthController.changePassword);
// router.post("/change-password", [checkJwt.checkJwt], AuthController.changePassword);

export default router;