import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import {validationResult} from "express-validator";
import jwt from "jsonwebtoken";

import {secret} from "../config.js";
import error from "../auxilary/error.js";



const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: "2h"});
}


class authController {
    async registration(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка при регистрации", errors});
            }

            const {username, password, name, surname, group, vk} = req.body;
            const candidate = await User.findOne({username});

            if(candidate){
                return resp.status(400).json({message: "Пользователь с таким статусом уже существует"});
            }

            const hashPassword = bcrypt.hashSync(password, 7);

            await User.create({username, password: hashPassword,  name, surname, roles: ["USER"], group, vk});

            return resp.status(200).json("ok");
        } catch (e){
            console.error(e);
            resp.status(400).json({message: "Registration error"});
        }
    }

    async login(req, resp){
        try{
            const {password, username} = req.body;
            const user = await User.findOne({username});
            if(!user){
                return resp.status(400).json({message: "Пользователь не найден"})
            }

            const isValidPassword = bcrypt.compareSync(password, user.password); //сравнит пароль и хеш вернёт bool

            if(!isValidPassword){
                return resp.status(400).json({message: "Неверный пароль"});
            }

            const token = generateAccessToken(user._id, user.roles);
            return resp.json({token, expiresIn: 3600 * 3, roles: user.roles, name: user.name + " " + user.surname});

        } catch (e){
            console.error(e);
            resp.status(400).json({message: "Login  error"});
        }
    }

    validToken(req, resp){
        const {token} = req.body;
        try{
            req.user = jwt.verify(token, secret);
            resp.json("ok");
        } catch (e){
            resp.status(400).json(error("Bad token"));
        }

    }

    async getUsers(req, resp){
        try{
            let users = await User.find();
            resp.json(users);
        } catch (e){

        }
    }

    async changeRole(req, resp){
        try{
            const {id, role} = req.body;
            const user = await User.findOne({_id: id});
            if(!user){
                return resp.status(404).json({message: "Пользователь не найден"});
            }
            user.roles = [role];

            await User.updateOne({_id: id}, user);

            return resp.status(200);


        } catch (e) {
            return resp.status(400).json({message: "Ошибка при обновлении роли"});
        }
    }
}

export default new authController();