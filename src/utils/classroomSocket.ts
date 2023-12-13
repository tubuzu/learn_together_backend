import { Socket } from "socket.io";
import SocketInterface from "../interfaces/websocket.interface.js";
import WebSocket from "./webSocket.js";
import { ClassroomModel } from "../models/classroom.model.js";

class ClassroomSocket implements SocketInterface {

  handleConnection(socket: Socket) {
    const io = WebSocket.getInstance();
    let tempId = "";

    // onClassroomJoin
    socket.on("onClassroomJoin", ({ classroomId }: any) => {
      console.log(`${tempId} joined a Classroom of ID: ${classroomId}`);
      socket.join(`classroom-${classroomId}`);
      io.to(`classroom-${classroomId}`).emit("userClassroomJoin");
    });
    // onClassroomLeave
    socket.on("onClassroomLeave", ({ classroomId }: any) => {
      console.log(`${tempId} left a Classroom of ID: ${classroomId}`);
      socket.leave(`classroom-${classroomId}`);
      io.to(`classroom-${classroomId}`).emit("userClassroomLeave");
    });

    socket.on("getOnlineClassroomUsers", async ({ classroomId }: any) => {
      console.log("getOnlineClassroomUsers");
      const classroom = await ClassroomModel.findById(classroomId).populate(
        "currentParticipants"
      );
      if (!classroom) return;
      const onlineUsers: any = [];
      const offlineUsers: any = [];
      classroom.currentParticipants.forEach((user: any) => {
        const socket = WebSocket.onlineUsers.get(user._id.toString());
        socket ? onlineUsers.push(user) : offlineUsers.push(user);
      });
      socket.emit("onlineClassroomUsersReceived", {
        onlineUsers,
        offlineUsers,
      });
    });
  }

  static getByValue(searchValue: any) {
    for (let [key, value] of WebSocket.onlineUsers.entries()) {
      if (value === searchValue) return key;
    }
  }

  middlewareImplementation(socket: Socket, next: any) {
    //Implement your middleware for orders here
    return next();
  }
}

export default ClassroomSocket;
