import { Group } from "./group";
import { GroupMember } from "./member";

type RobloxWallpostUserObject = {
  userId: number,
  username: string
}
type RobloxWallpostRoleObject = {
  id: number,
  name: string,
  description: string,
  rank: number,
  memberCount: number
}
type RobloxWallpostData = {
  id: number,
  poster: {
    user: RobloxWallpostUserObject
    role: RobloxWallpostRoleObject
  },
  body: string,
  created: string,
  updated: string
}

export default class Wallpost {
  public id: number;
  public poster: GroupMember | {
    user: RobloxWallpostUserObject,
    role: RobloxWallpostRoleObject
  }

  constructor(public group: Group, data: RobloxWallpostData) {
    this.id = data.id;
    this.poster = data.poster;

    this.loadMember();
  }

  async loadMember() : Promise<void> {
    if (!(this.poster instanceof GroupMember)) {
      const member = await this.group.getMember(this.poster.user.userId, true);
      // TODO: use this as an opportunity to update the member roles
      this.poster = member;
    }
  }

  public async delete() {}
}