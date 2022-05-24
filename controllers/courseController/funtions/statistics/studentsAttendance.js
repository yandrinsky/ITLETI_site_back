import Meeting from "../../../../models/Meeting.js";
import Course from "../../../../models/Course.js";
import User from "../../../../models/User.js";
import CA from "../../../../models/CourseAccount.js";
import * as mongoose from "mongoose";

export async function getCourseStudentsAttendance({course_id}){
    let course = await Course.findOne({_id: course_id});
    let meetings = await Meeting.find({_id: course.meetings});
    let CAS = await CA.find({_id: course.students});
    let users = await User.find({_id: CAS.map(CA => CA.user_id)});
    const ObjectId = mongoose.Types.ObjectId;
    console.log(CAS[0]._id === new ObjectId("621294d76b7d176acc3f5ba7"))
    let res = course.students.map(id => {
        let user_id = CAS.filter(cur =>  cur._id === `new ObjectId("${id}")`)[0]?.user_id;
        //console.log("user_id", user_id);
        let user = users.filter(cur => cur._id === user_id)[0];
        if(user){
            return {
                attendanceCount: 0,
                attendance: meetings.map(meeting => {
                    const res = meeting.students.includes(id);
                    this.attendanceCount += res;
                    return res;
                }),
                vk_link: user.vk_link,
                name: user.name,
                surname: user.surname,
            }
        } else{
            return null;
        }

    })
    return {
        meetings,
        attendance: res.filter(item => item !== null),
    }
    //return "ok"
}

