import { OpentokService } from './opentok.service';
const otService = new OpentokService();


const apiKey  = '';
const sessionId = '';
const token = '';

const initializedTokBoxSession = otService.initSession(apiKey, sessionId);

initializedTokBoxSession.pipe().subscribe(() => console.log('Guess what?!'));