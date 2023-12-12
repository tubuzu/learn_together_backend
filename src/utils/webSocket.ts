import { socketio } from "../server.js";
import { ClassroomModel } from "../models/classroom.model.js";

export class WebSockets {
  static onlineUsers = new Map();
  static getOnlineUsers = () => WebSockets.onlineUsers;
  connection(socket: any) {
    let tempId = "";
    // event fired when the chat room is disconnected
    socket.on("disconnect", () => {
      console.log(`user ${tempId} disconnect`);
      WebSockets.onlineUsers.delete(tempId);
      tempId = "";
    });
    // add identity of user mapped to the socket id
    socket.on("identity", (userId: string) => {
      WebSockets.onlineUsers.set(userId, socket.id);
      tempId = userId;
      console.log(`user ${userId} connect`);
    });
    // onClassroomJoin
    socket.on("onClassroomJoin", ({ classroomId }: any) => {
      console.log(
        `${tempId} joined a Classroom of ID: ${classroomId}`,
      );
      socket.join(`classroom-${classroomId}`);
      socketio.to(`classroom-${classroomId}`).emit("userClassroomJoin");
    });
    // onClassroomLeave
    socket.on("onClassroomLeave", ({ classroomId }: any) => {
      console.log(
        `${tempId} left a Classroom of ID: ${classroomId}`,
      );
      socket.leave(`classroom-${classroomId}`);
      socketio.to(`classroom-${classroomId}`).emit("userClassroomLeave");
    });

    socket.on("getOnlineClassroomUsers", async ({ classroomId }: any) => {
      const classroom = await ClassroomModel.findById(classroomId).populate(
        "currentParticipants"
      );
      if (!classroom) return;
      const onlineUsers: any = [];
      const offlineUsers: any = [];
      classroom.currentParticipants.forEach((user: any) => {
        const socket = WebSockets.onlineUsers.get(user._id.toString());
        socket ? onlineUsers.push(user) : offlineUsers.push(user);
      });
      socket.emit("onlineClassroomUsersReceived", {
        onlineUsers,
        offlineUsers,
      });
    });
  }

  static getByValue(searchValue: any) {
    for (let [key, value] of WebSockets.onlineUsers.entries()) {
      if (value === searchValue) return key;
    }
  }
}
