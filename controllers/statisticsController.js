import User from "../models/User.js";

class StatisticsController{
    async groupsAndCourses(req, resp){
        let data = {
            course1: 0,
            course2: 0,
            course3: 0,
            course4: 0,
            course5: 0,
            course6: 0,
            amount: 0,
        };
        let users = await User.find();
        data.amount = users.length;
        users.forEach(user => {
            if(data.hasOwnProperty(user.group)){
                data[user.group] += 1;
            } else {
                data[user.group] = 1;
            }
            let fl = user.group[0][0];
            if(fl === "1"){
                data.course1 += 1;
            }
            if(fl === "0"){
                data.course2 += 1;
            }
            if(fl === "9"){
                data.course3 += 1;
            }
            if(fl === "8"){
                data.course4 += 1;
            } if(fl === "7"){
                data.course5 += 1;
            }
            if(fl === "6"){
                data.course6 += 1;
            }
        })
        data.totalGroups = Object.keys(data).length;
        resp.json(data).status(200);

    }
}

export default new StatisticsController();