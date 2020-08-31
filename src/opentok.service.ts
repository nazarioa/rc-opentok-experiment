// @ts-nocheck
// because of implicit event types errors

import * as OT from '@opentok/client';
import {Observable, of, throwError} from 'rxjs';
import {filter, shareReplay, tap} from 'rxjs/operators';
import {OtEventNames} from './opentok.model';
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
    /*
    this.isCoachConnected$ = merge(
      this.streamLifecycleEvents$.pipe(
        map((event) => !!event['target']['connections'].find((c) => this.isCoachConnection(c))),
        take(1)
      ),
      this.sessionConnectionLifecycleEvents$.pipe(
        filter((event) => this.isCoachConnection(event['connection'])),
        map((event) => event.type === OtEventNames.ConnectionCreated || event.type !== OtEventNames.ConnectionDestroyed)
      )
    ).pipe(startWith(false), shareReplay(1));
    */

    this.coachStreamLifecycleEvents$ = this.streamLifecycleEvents$.pipe(
      filter((event) => event['stream'] && event['stream'].connection && this.isCoachConnection(event['stream'].connection))
    );

    this.memberStreamLifecycleEvents$ = this.streamLifecycleEvents$.pipe(
      filter((event) => event['stream'] && event['stream'].connection && !this.isCoachConnection(event['stream'].connection)),
      // tslint:disable:no-console
      tap((_) => console.log('naz:: memberStreamLifecycleEvents$', _))
    );

    /**
     * Coach connection information used by client to send messages back to the coach
     * /
    this.coachCommunicationConnection$ = this.sessionConnectionLifecycleEvents$.pipe(
      map((event) => event['target']['connections'].find((c) => this.isCoachConnection(c))),
      filter((connection) => !!connection),
      shareReplay(1)
    );

    /**
     * The classroom session closed signal either by coach or by BE close time. (Not to be confused with TokBoxSession).
     * /
    this.closeSessionSignal$ = this.masterEvents$.pipe(
      filter((event) => event.type === `signal:${Signal.CloseSession}`),
      shareReplay(1)
    );

    this.videoSharedSignal$ = this.masterEvents$.pipe(
      filter((event) => event.type === `signal:${Signal.VideoShared}`),
      map((event) => {
        const data = JSON.parse(event['data']) as VideoData;
        event['data'] = data;
        return event;
      }),
      shareReplay(1)
    );

    this.videoActiveSignal$ = this.masterEvents$.pipe(filter((event) => event.type === `signal:${Signal.VideoActive}`));

    this.coachRequestsSync$ = this.masterEvents$.pipe(
      filter((event) => event.type === `signal:${Signal.VideoSync}` && event['data'] === 'coachSync'),
      shareReplay(1)
    );

    this.stageAccessStatusSignal$ = this.masterEvents$.pipe(
      filter((event) =>
        [
          `signal:${Signal.StageRequestApproved}`,
          `signal:${Signal.StageRequestDenied}`,
          `signal:${Signal.StageRevoked}`,
        ].includes(event.type)
      ),
      shareReplay(1)
    );

    this.handStatusSignal$ = this.masterEvents$.pipe(
      filter((event) => [`signal:${Signal.HandLowered}`, `signal:${Signal.HandRaised}`].includes(event.type)),
      shareReplay(1)
    );

    /**
     * Opentok Session Lifecycle Events.
     * Not to be confused with classroom session events.
     * /
    this.sessionLifecycleEvents$ = this.masterEvents$.pipe(
      filter((event) =>
        [
          OtEventNames.SessionConnected,
          OtEventNames.SessionDisconnected,
          OtEventNames.SessionReconnected,
          OtEventNames.SessionReconnecting,
        ].includes(event.type)
      ),
      shareReplay(1)
    );

    this.browserAudioAccessEvents$ = this.masterEvents$.pipe(
      filter((event) => [OtEventNames.AudioBlocked, OtEventNames.AudioUnBlocked].includes(event.type)),
      shareReplay(1)
    );

    this.chatter$ = combineLatest([this.audioLevelEvents$, this.groupChannel$]).pipe(
      map(([e, group]) => {
        const memberData = this.getMemberFromConnection(e.target['stream'].connection, group);
        return { audioLevel: e['audioLevel'], ...memberData };
      }),
      scan((acc, curr) => {
        const pos = acc.findIndex((e) => curr.id === e.id);
        if (pos > -1) {
          acc.splice(pos, 1, curr);
        } else {
          acc.push(curr);
        }
        return acc;
      }, []),
      sampleTime(200)
    );

    this.streamPropertyChangedEvent$ = this.masterEvents$.pipe(
      filter((event) => event.type === OtEventNames.StreamPropertyChanged)
    );

    // If this member joins late we must fill members$ with previous connections, subsequent updates handled below.
    combineLatest([
      this.sessionConnectionLifecycleEvents$.pipe(
        take(1),
        pluck<OT.Event<OtEventNames.StreamCreated | OtEventNames.StreamDestroyed, OT.Session>, Array<OT.Connection>>(
          'target',
          'connections'
        )
      ),
      this.groupChannel$,
    ])
      .pipe(
        mergeMap(([connections, groupChannel]) => {
          const arrayOfMemberData = connections.map((connection) =>
            this.getMemberFromConnection(connection, groupChannel)
          );
          return from(arrayOfMemberData);
        }),
        filter((member) => !!member),
        combineWith(this.members$),
        map(([member, memberList]) => this.addMemberToArray(member, memberList))
      )
      .subscribe((members) => this.members$.next(members));

    // Used to update the list of connected members
    merge(this.memberJoins, this.memberDeparts).subscribe((members) => this.members$.next(members));
    */

    if (this.opentokSession) {
      return of(null);
    } else {
      return throwError(new Error('Error: Could not establish OpenTok connection'));
    }

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
    console.warn('naz:: inside of sessionMediaSubscribe ');
    return new Observable((observer) => {
      console.log('naz:: inside of sessionMediaSubscribe subscriber ');
      const subscription = this.opentokSession.subscribe(stream, element, options, (err) => {
        if (err) {
          console.log('naz:: inside of sessionMediaSubscribe callback, err ', err, element, options);
          observer.error(err);
        } else {
          console.log('naz:: inside of sessionMediaSubscribe callback, v ', subscription, element, options);
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
    const publisher = this.OT.initPublisher(element, options);
    if (!publisher) {
      return throwError('Error, Could not initialize publisher');
    }
    return of(publisher);
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

}
