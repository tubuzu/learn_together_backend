export type ClassroomNewMemberNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type JoinRequestRejectedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type JoinRequestAcceptedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type ClassroomMemberKickedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type ClassroomTutorUpdatedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type ClassroomOwnerUpdatedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type ClassroomTerminatedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type ClassroomStartedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};
export type ClassroomFinishedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  classroomId: string;
};

export type ProofOfLevelAcceptedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  proofOfLevelId: string;
  requestId: string;
};
export type ProofOfLevelRejectedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  requestId: string;
};

export type RechargeCoinSuccessNotiDTO = {
  targetUserId: string;
  originUserId: string;
  orderId: string;
  amountOfCoin: number;
};

export type DonateCoinSuccessNotiDTO = {
  targetUserId: string;
  originUserId: string;
  orderId: string;
  amountOfCoin: number;
};

export type WithdrawRequestSubmittedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  orderId: string;
  amountOfCoin: number;
};
export type WithdrawRequestCanceledNotiDTO = {
  targetUserId: string;
  originUserId: string;
  orderId: string;
  amountOfCoin: number;
}
export type WithdrawRequestAcceptedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  orderId: string;
  amountOfCoin: number;
};
export type WithdrawRequestRejectedNotiDTO = {
  targetUserId: string;
  originUserId: string;
  orderId: string;
  amountOfCoin: number;
};