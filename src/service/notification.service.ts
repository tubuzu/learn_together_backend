import { ClassroomFinishedNotiDTO, ClassroomMemberKickedNotiDTO, ClassroomNewMemberNotiDTO, ClassroomOwnerUpdatedNotiDTO, ClassroomStartedNotiDTO, ClassroomTerminatedNotiDTO, ClassroomTutorUpdatedNotiDTO, DonateCoinSuccessNotiDTO, JoinRequestAcceptedNotiDTO, JoinRequestRejectedNotiDTO, ProofOfLevelAcceptedNotiDTO, ProofOfLevelRejectedNotiDTO, RechargeCoinSuccessNotiDTO, WithdrawRequestAcceptedNotiDTO, WithdrawRequestCanceledNotiDTO, WithdrawRequestRejectedNotiDTO, WithdrawRequestSubmittedNotiDTO } from "../dtos/notification.dto.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { NotificationCode } from "../utils/const.js";

export const getUserNotifications = async (
  userId: string,
  page: number,
  perPage: number
) => {
  return await NotificationModel.find({
    targetUser: userId,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
};

export const createClassroomNewMemberNoti = async (
  request: ClassroomNewMemberNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__NEW_MEMBER,
    extraData: request,
  });
};

export const createJoinRequestRejectedNoti = async (
  request: JoinRequestRejectedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__JOIN_REQUEST_REJECTED,
    extraData: request,
  });
};

export const createJoinRequestAcceptedNoti = async (
  request: JoinRequestAcceptedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__JOIN_REQUEST_ACCEPTED,
    extraData: request,
  });
};

export const createMemberKickedNoti = async (
  request: ClassroomMemberKickedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__MEMBER_KICKED,
    extraData: request,
  });
};

export const createTutorUpdatedNoti = async (
  request: ClassroomTutorUpdatedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__TUTOR_UPDATED,
    extraData: request,
  });
};

export const createOwnerUpdatedNoti = async (
  request: ClassroomOwnerUpdatedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__OWNER_UPDATED,
    extraData: request,
  });
};

export const createClassroomTerminatedNoti = async (
  request: ClassroomTerminatedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__CLASSROOM_TERMINATED,
    extraData: request,
  });
};
export const createClassroomStartedNoti = async (
  request: ClassroomStartedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__CLASSROOM_STARTED,
    extraData: request,
  });
};
export const createClassroomFinishedNoti = async (
  request: ClassroomFinishedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.CLASSROOM__CLASSROOM_FINISHED,
    extraData: request,
  });
};

export const createProofOfLevelAcceptedNoti = async (
  request: ProofOfLevelAcceptedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.PROOF_OF_LEVEL__PROOF_OF_LEVEL_ACCEPTED,
    extraData: request,
  });
};
export const createProofOfLevelRejectedNoti = async (
  request: ProofOfLevelRejectedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.PROOF_OF_LEVEL__PROOF_OF_LEVEL_REJECTED,
    extraData: request,
  });
};

export const createRechargeCoinSuccessNoti = async (
  request: RechargeCoinSuccessNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.RECHARGE__RECHARGE_COIN_SUCCESS,
    extraData: request,
  });
};

export const createDonateCoinSuccessNoti = async (
  request: DonateCoinSuccessNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.DONATE__DONATE_COIN_SUCCESS,
    extraData: request,
  });
};

export const createReceivedCoinNoti = async (
  request: DonateCoinSuccessNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.DONATE__DONATE_COIN_SUCCESS,
    extraData: request,
  });
};

export const createWithdrawRequestSubmittedNoti = async (
  request: WithdrawRequestSubmittedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.WITHDRAW__WITHDRAW_REQUEST_SUBMITTED,
    extraData: request,
  });
};

export const createWithdrawRequestCanceledNoti = async (
  request: WithdrawRequestCanceledNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.WITHDRAW__WITHDRAW_REQUEST_CANCELED,
    extraData: request,
  });
};

export const createWithdrawRequestAcceptedNoti = async (
  request: WithdrawRequestAcceptedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.WITHDRAW__WITHDRAW_REQUEST_ACCEPTED,
    extraData: request,
  });
};

export const createWithdrawRequestRejectedNoti = async (
  request: WithdrawRequestRejectedNotiDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    content: request.content,
    notificationCode: NotificationCode.WITHDRAW__WITHDRAW_REQUEST_REJECTED,
    extraData: request,
  });
};