import jwt from "jsonwebtoken";
import {secret} from "../config.js";

export default (req, resp, next) => {
    if(req.method === "OPTIONS"){
        console.log("options?");
        next();
    }

    try {
        const token = req.headers.authorization.split(" ")[1];

        if(!token){
            return resp.status(403).json({message: "Пользователь не авторизован"});
        }
        req.user = jwt.verify(token, secret);
        next();
    }catch (e){
        return resp.status(403).json({message: "Пользователь не авторизован"});
    }
}
