export enum Signal {
  CloseSession = 'closeSession',
  StageRequest = 'stageRequest',
  StageRequestApproved = 'stageRequestApproved',
  StageRequestDenied = 'stageRequestDenied',
  StageRequestCanceled = 'stageRequestCanceled',
  StageRevoked = 'stageRevoked',
  HandLowered = 'handLowered',
  HandRaised = 'handRaised',
  VideoShared = 'videoShared',
  VideoActive = 'videoActive',
  VideoSync = 'videoSync',
}

export interface ConnectionData {
  classroomSessionId: string;
  rallyId?: string;
  coachId?: string;
  membershipType?: any;
}
