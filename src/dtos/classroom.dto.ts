export interface ClassroomParams {
  classroomName: string;
  subject: string;
  maxParticipants: number;
  longitude: number;
  latitude: number;
  address: string;
  startTime: number;
  endTime: number;
  ownerIsTutor: boolean;

  //option
  description?: string;
  isPublic?: boolean;
  ownerApprovalRequired?: boolean;
  secretKey?: string;
}
