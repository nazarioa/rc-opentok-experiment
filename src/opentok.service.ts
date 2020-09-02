// @ts-nocheck
// because of implicit event types errors

import * as OT from '@opentok/client';
import {Observable, of, throwError} from 'rxjs';
import {filter, shareReplay} from 'rxjs/operators';
import {OtEventNames, OtSignalSendRequest} from './opentok.model';
import {ConnectionData, Signal} from "./live-session.model";

export class OpentokService {
  masterEvents$: Observable<any>;
  sessionConnectionLifecycleEvents$: Observable<OT.Event<any, any>>;
  streamLifecycleEvents$: Observable<OT.Event<any, any>>;
  coachStreamLifecycleEvents$: Observable<OT.Event<any, any>>;
  memberStreamLifecycleEvents$: Observable<OT.Event<any, any>>;

  private opentokSession: OT.Session;

  constructor() {}

  get OT(): any {
    return OT;
  }

  /**
   * Initializes an OpenTok session and sets up observable streams.
   * @param apiKey
   * @param liveVideoSessionId
   * @param programId
   */
  initSession(apiKey: string, liveVideoSessionId: string): Observable<void> {
    this.OT.on(OtEventNames.Exception, (err) => console.warn('Error from Tokbox: ', err));

    this.opentokSession = this.OT.initSession(apiKey, liveVideoSessionId);

    if (!this.opentokSession) {
      throw new Error('opentokSession failed to init');
    }

    this.masterEvents$ = new Observable<any>((observer) =>
      this.opentokSession.on({
        [`signal:${Signal.CloseSession}`]: (event) => observer.next(event),
        [`signal:${Signal.HandLowered}`]: (event) => observer.next(event),
        [`signal:${Signal.HandRaised}`]: (event) => observer.next(event),
        [`signal:${Signal.StageRequestApproved}`]: (event) => observer.next(event),
        [`signal:${Signal.StageRequestDenied}`]: (event) => observer.next(event),
        [`signal:${Signal.StageRevoked}`]: (event) => observer.next(event),
        [`signal:${Signal.VideoActive}`]: (event) => observer.next(event),
        [`signal:${Signal.VideoShared}`]: (event) => observer.next(event),
        [`signal:${Signal.VideoSync}`]: (event) => observer.next(event),
        [OtEventNames.AudioBlocked]: (event) => observer.next(event),
        [OtEventNames.AudioUnBlocked]: (event) => observer.next(event),
        [OtEventNames.ConnectionCreated]: (event) => observer.next(event),
        [OtEventNames.ConnectionDestroyed]: (event) => observer.next(event),
        [OtEventNames.SessionConnected]: (event) => observer.next(event),
        [OtEventNames.SessionDisconnected]: (event) => observer.next(event),
        [OtEventNames.SessionReconnected]: (event) => observer.next(event),
        [OtEventNames.SessionReconnecting]: (event) => observer.next(event),
        [OtEventNames.StreamCreated]: (event) => observer.next(event),
        [OtEventNames.StreamDestroyed]: (event) => observer.next(event),
        [OtEventNames.StreamPropertyChanged]: (event) => observer.next(event),
      })
    );

    this.sessionConnectionLifecycleEvents$ = this.masterEvents$.pipe(
      filter((event) => [OtEventNames.ConnectionCreated, OtEventNames.ConnectionDestroyed].includes(event.type)),
      shareReplay(1)
    );

    this.streamLifecycleEvents$ = this.masterEvents$.pipe(
      filter((event) => [OtEventNames.StreamCreated, OtEventNames.StreamDestroyed].includes(event.type)),
      shareReplay(1)
    );

    this.coachStreamLifecycleEvents$ = this.streamLifecycleEvents$.pipe(
      filter((event) => event['stream'] && event['stream'].connection && this.isCoachConnection(event['stream'].connection)),
  );

    this.memberStreamLifecycleEvents$ = this.streamLifecycleEvents$.pipe(
      filter((event) => event['stream'] && event['stream'].connection && !this.isCoachConnection(event['stream'].connection)),
    );

    if (this.opentokSession) {
      return of(null);
    } else {
      return throwError(new Error('Error: Could not establish OpenTok connection'));
    }
  }

  get connectionId(): string {
    return this.opentokSession?.connection?.connectionId ?? '';
  }

  connectSession(token: string): Observable<void> {
    return new Observable((observer) => {
      this.opentokSession.connect(token, (err) => {
        if (err) {
          observer.error(err);
        } else {
          observer.next();
          observer.complete();
        }
      });
    });
  }

  sessionMediaSubscribe(
    element: string,
    stream: OT.Stream,
    options?: OT.SubscriberProperties
  ): Observable<OT.Subscriber> {
    return new Observable((observer) => {
      const subscription = this.opentokSession.subscribe(stream, element, options, (err) => {
        if (err) {
          observer.error(err);
        } else {
          observer.next(subscription);
          observer.complete();
        }
      });
    });
  }


  /**
   * One of two forms to setup a publisher.
   * @note OpenTok bug: This form of `publish` does exist in the Typescript but as of v2.17, this form ignores the PublisherProperty:
   * publishVideo: false. Use with caution.
   *
   * @param element
   * @param options
   */
  sessionMediaInitPublisher(element: string, options?: OT.PublisherProperties): Observable<OT.Publisher> {
    /*
    const publisher = this.OT.initPublisher(element, options);
    if (!publisher) {
      return throwError('Error, Could not initialize publisher');
    }
    return of(publisher);
*/
    return new Observable<OT.Publisher>(observer => {
      const publisher = this.OT.initPublisher(element, options, err => {
        if (err) {
          console.log('naz: sessionMediaInitPublisher >>> ERR')
          observer.error(err);;
        } else {
          console.log('>>>>naz: sessionMediaInitPublisher >>> SUCCESS')
          observer.next(publisher);
          observer.complete();
        }
      })
    });
  }

  publishMediaToStream(publisher: OT.Publisher): Observable<void> {
    return new Observable((observer) => {
      this.opentokSession.publish(publisher, (err) => {
        if (err) {
          observer.error(err);
        } else {
          observer.next();
          observer.complete();
        }
      });
    });
  }

  isCoachConnection(connection: OT.Connection): boolean {
    const data = this.parseConnectionData<ConnectionData>(connection);
    return data !== null && !!data.coachId;
  }

  parseConnectionData<D>(connection: OT.Connection): D {
    if (typeof connection && connection.data && connection.data === 'undefined') {
      return null;
    }

    let result = null;
    try {
      result = JSON.parse(connection.data) as D;
    } catch (e) {
      console.error('Error parsing stream connection data', e, connection);
    }
    return result;
  }

  sendSessionSignal<T extends string>(signal: OtSignalSendRequest<T>): Observable<void> {
    return new Observable((observer) => {
      this.opentokSession.signal(signal, (err) => {
        if (err) {
          observer.error(err);
        } else {
          observer.next();
          observer.complete();
        }
      });
    });
  }
}
