import { Injectable } from '@angular/core';
import { ApiClient, HelixChannel, HelixChannelEmote, HelixUser, UserIdResolvable } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';

const TWITCH_CLIENT_ID = "dxynzrrxi45nq9udpmu37lducmsus1";
const TWITCH_SECRET = "pvr03692vdv264ikq3pcp9rnkkqhrt";

@Injectable({
  providedIn: 'root'
})
export class TwitchApiService {
  private authProvider = new AppTokenAuthProvider(TWITCH_CLIENT_ID, TWITCH_SECRET);
  private client = new ApiClient({ authProvider: this.authProvider });

  public getUserByName(username: string): Promise<HelixUser | null> {
    if (!username) return Promise.resolve(null);

    return this.client.users.getUserByName(username);
  }

  public getChannelEmotes(channelOrId: UserIdResolvable): Promise<HelixChannelEmote[]> {
    return this.client.chat.getChannelEmotes(channelOrId);
  }
}
