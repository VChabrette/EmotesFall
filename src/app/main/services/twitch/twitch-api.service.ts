import { Injectable } from '@angular/core';
import { ApiClient, HelixChannelEmote, HelixUser, UserIdResolvable } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TwitchApiService {
  private authProvider = new AppTokenAuthProvider(environment.twitchClientId!, environment.twitchSecret!);
  private client = new ApiClient({ authProvider: this.authProvider });

  public getUserByName(username: string): Promise<HelixUser | null> {
    if (!username) return Promise.resolve(null);

    return this.client.users.getUserByName(username);
  }

  public getChannelEmotes(channelOrId: UserIdResolvable): Promise<HelixChannelEmote[]> {
    return this.client.chat.getChannelEmotes(channelOrId);
  }
}
