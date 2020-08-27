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

export enum OtEventNames {
  AudioBlocked = 'audioBlocked',
  AudioLevelUpdated = 'audioLevelUpdated',
  AudioUnBlocked = 'audioUnBlocked',
  ConnectionCreated = 'connectionCreated',
  ConnectionDestroyed = 'connectionDestroyed',
  Exception = 'exception',
  SessionConnected = 'sessionConnected',
  SessionDisconnected = 'sessionDisconnected',
  SessionReconnected = 'sessionReconnected',
  SessionReconnecting = 'sessionReconnecting',
  StreamCreated = 'streamCreated',
  StreamDestroyed = 'streamDestroyed',
  StreamPropertyChanged = 'streamPropertyChanged',
}

export interface OtSignalSendRequest<T extends string> {
  type?: T;
  data?: string;
  to?: OT.Connection;
}
