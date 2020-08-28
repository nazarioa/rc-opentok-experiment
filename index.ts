import {OpentokService} from './opentok.service';
import {filter, switchMap, switchMapTo, tap} from "rxjs/operators";
import {OtEventNames} from './opentok.model';
import data from './secrets.json';

const otService = new OpentokService();
const initializedTokBoxSession = otService.initSession(data.apiKey, data.sessionId);

initializedTokBoxSession.pipe(
  switchMapTo(otService.connectSession(data.token)),
).subscribe({
  next: n => console.log('Success initLiveSession', n),
  error: e => console.log('Fail initLiveSession', e),
});

otService.coachStreamLifecycleEvents$.pipe(
  filter(event => event.type === OtEventNames.StreamCreated),
  switchMap(event => otService.sessionMediaSubscribe('camera-outlet', event['stream'], {
    fitMode: 'contain',
    height: '100%',
    insertMode: 'append',
    showControls: false,
    subscribeToAudio: false,
    subscribeToVideo: true,
    width: '100%',
  }))
).subscribe({
  next: n => console.log('Connect to coach video - success', n),
  error: e => console.log('Connect to coach video - fail', e),
});
