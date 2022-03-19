import jwt from "jsonwebtoken";
import {secret} from "../config.js";
import error from "../auxilary/error.js";

export default (req, resp, next) => {
    if(req.method === "OPTIONS"){
        console.log("options?");
        next();
    }

    try {
        const token = req.headers.authorization.split(" ")[1];

        if(!token){
            return resp.status(403).json(error("Пользователь не авторизован", 1));
        }
        req.user = jwt.verify(token, secret);
        next();
    }catch (e){
        return resp.status(403).json(error("Пользователь не авторизован", 1));
    }
}
