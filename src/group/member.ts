import { Group } from "./group";
import { GroupRole } from "./groupRole";
import { User } from "../user";

export class GroupMember {
  public username: string;
  public userid: number;

  constructor(public group: Group, public user: User, public role: GroupRole) {
    // Aliases
    this.username = this.user.username!;
    this.userid = this.user.userid;
  }

  deleteAllWallPosts() {}
  setRank() {}
  exile() {}
}