import { Client } from "./client";
import { Group } from "../group";
import Collection from "@discordjs/collection";
import { GroupMember } from "../group/member";

type RobloxUserPresenceObject = {
  userPresenceType: number,
  lastLocation: string,
  placeId: number,
  rootPlaceId: number,
  gameId: string,
  universeId: string,
  userId: number,
  lastOnline: string
}

type RobloxThumbnailResultObject = {
  targetId: number,
  state: string,
  imageUrl: string
}

export enum UserPresenceType {
  Offline = 0,
  Online = 1,
  InGame = 2,
  InStudio = 3
}

export type UserPresence = {
  type: UserPresenceType,
  lastLocation: string,
  lastOnline: Date
}
export type AvatarThumbnailSize = '100x100' | '352x352' | '720x720'
export type HeadshotThumbnailSize = '48x48' | '60x60' | '150x150'

export class User {
  public username?: string;
  public premium?: boolean;
  public description?: string;
  public status?: string;
  public thumbnails: { avatar?: string, headshot?: string } = {};
  public created?: Date;
  public banned?: boolean;
  public profileLink: string;
  public presence?: UserPresence;
  public groups: Collection<number, GroupMember>;

  constructor(public client: Client, public userid: number) {
    this.profileLink = `https://www.roblox.com/users/${this.userid}/profile`
    this.groups = new Collection();
  }

  private update(data: { [key: string]: any }, propertyMap: { [key: string]: string }) {
    // Used to update the instance properties when a HTTP request is performed
    for (const key in data) {
      if (propertyMap[key]) {
        Object.defineProperty(this, propertyMap[key], { value: data[key], writable: true, configurable: true, enumerable: true });
      }
    }
  }

  public async getDescription(allowcache: boolean = false) : Promise<string | null> {
    if (allowcache && this.description) return this.description;
    const response = await this.client.request({ url: `https://users.roblox.com/v1/users/${this.userid}`, method: 'GET' });
    if (response.status === 200) {
      this.update(response.data, { name: 'username', id: 'userid', description: 'description', isBanned: 'banned'})
      return response.data.description;
    }
    return null;
  }

  public async getStatus(allowcache: boolean = false) : Promise<string | null> {
    if (allowcache && this.status) return this.status;
    const response = await this.client.request({ url: `https://www.roblox.com/users/profile/profileheader-json?userid=${this.userid}`, method: 'GET' });
    if (response.status === 200) {
      this.update(response.data, { ProfileUserName: 'username', UserStatus: 'status'})
      return this.status!;
    }
    return null;
  }

  public async hasPremium(allowcache: boolean = false) : Promise<boolean | null> {
    if (allowcache && this.premium !== undefined) return this.premium;
    const response = await this.client.request({ url: `https://premiumfeatures.roblox.com/v1/users/${this.userid}/validate-membership`, method: 'GET' });
    if (response.status === 200) {
      this.premium = (response.data as boolean);
      return this.premium
    }
    return null;
  }

  public async getAvatarThumbnail(size: AvatarThumbnailSize = '100x100', format: string = 'Png', circular: boolean = false) : Promise<string | null> {
    // TODO: this function should be exposed outside of a user instance so that a user can request multiple user ids at once if necessary
    const response = await this.client.request({ url: `https://thumbnails.roblox.com/v1/users/avatar?userIds=${this.userid}&size=${size}&format=${format}&isCircular=${circular}`, method: 'GET' });
    if (response.status === 200) {
      const data = (response.data.data as RobloxThumbnailResultObject[]).find((obj: { targetId: number, state: string, imageUrl: string}) => obj.targetId === this.userid);
      if (data && data.state === 'Completed' && data.imageUrl) {
        this.thumbnails.avatar = data.imageUrl;
        return this.thumbnails.avatar!;
      }
      return null;
    }
    return null;
  }

  public async getHeadshotThumbnail(size: HeadshotThumbnailSize = '48x48', format: string = 'Png', circular: boolean = false) : Promise<string | null> {
    // TODO: this function should be exposed outside of a user instance so that a user can request multiple user ids at once if necessary
    const response = await this.client.request({ url: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${this.userid}&size=${size}&format=${format}&isCircular=${circular}`, method: 'GET' });
    if (response.status === 200) {
      const data = (response.data.data as RobloxThumbnailResultObject[]).find((obj: { targetId: number, state: string, imageUrl: string}) => obj.targetId === this.userid);
      if (data && data.state === 'Completed' && data.imageUrl) {
        this.thumbnails.headshot = data.imageUrl;
        return this.thumbnails.headshot!;
      }
      return null;
    }
    return null;
  }

  public async getPresence(allowcache: boolean = false) : Promise<UserPresence | null> {
    if (allowcache && this.presence) return this.presence;
    // TODO: this function should be exposed outside of a user instance so that a user can request multiple user ids at once if necessary
    const response = await this.client.request({ url: `https://presence.roblox.com/v1/presence/users`, method: 'POST', data: { userIds: [this.userid] } });
    if (response.status === 200) {
      const data = (response.data.userPresences as RobloxUserPresenceObject[]).find(obj => obj.userId === this.userid);
      if (data) {
        // TODO: update to provide more info
        this.presence = {
          type: data.userPresenceType,
          lastLocation: data.lastLocation,
          lastOnline: new Date(data.lastOnline)
        }
        return this.presence
      }
      return null;
    }
    return null;
  }

  public getFollowers() {}
  public getFollowings() {}
  public getFriends() {}

  public async getGroups(allowcache: boolean = false) : Promise<Collection<number, GroupMember>> {
    if (allowcache) return this.groups;

    const response = await this.client.request({ url: `https://groups.roblox.com/v1/users/${this.userid}/groups/roles`, method: 'GET' });
    if (response.status === 200) {
      for (const robloxMemberObject of response.data.data) {
        const group = this.client._getOrCreateGroup(robloxMemberObject.group.id);
        // Update group data
        group._update(robloxMemberObject.group, { name: 'name', description: 'description'});
        const role = group._getOrCreateRole(robloxMemberObject.role)
        const member = group._getOrCreateMember(this, role);
        this.groups.set(group.groupid, member);
      }
    }
    return this.groups;
  }
}