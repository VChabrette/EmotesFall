import { Injectable } from '@angular/core';
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';

const TWITCH_CLIENT_ID = "dxynzrrxi45nq9udpmu37lducmsus1";
const TWITCH_SECRET = "pvr03692vdv264ikq3pcp9rnkkqhrt";

@Injectable({
  providedIn: 'root'
})
export class TwitchApiService {
  private authProvider = new AppTokenAuthProvider(TWITCH_CLIENT_ID, TWITCH_SECRET);
  public client = new ApiClient({ authProvider: this.authProvider });
}
