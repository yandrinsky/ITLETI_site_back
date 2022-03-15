import jwt from "jsonwebtoken";
import {secret} from "../config.js";
import User from "../models/User.js";

export default (roles) => {
    return async (req, resp, next) => {
        if(req.method === "OPTIONS"){
            next();
        }
        try {
            const token = req.headers.authorization;
            if(!token){
                return resp.status(403).json({message: "Пользователь не авторизован", code: 1});
            }

            let userData = jwt.verify(token, secret);
            userData = await User.findOne({_id: userData.id});
            req.user = {id: userData._id, username: userData.username, roles: userData.roles}

            let hasRole = false;

            req.user.roles.forEach(role => {
                hasRole = roles.includes(role) || hasRole;
            })

            if(!hasRole){
                return resp.status(403).json({message: "Недостаточно прав"});
            }
            next();
        }catch (e){
            return resp.status(403).json({message: "Пользователь не авторизован", code: 1});
        }
    }
}