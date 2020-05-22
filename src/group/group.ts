import Collection from "@discordjs/collection";
import { GroupRole } from "./groupRole";
import { GroupMember } from "./member";
import { User, Client } from "../user";

export class Group {
  public name?: string;
  public description?: string;
  public owner?: User;
  public members: Collection<number, GroupMember>;
  public roles: Collection<number, GroupRole>;
  // TODO: Shout, Social links, wallpost collection, roles. relationships. revenue. membership

  constructor(public client: Client, public groupid: number) {
    this.roles = new Collection();
    this.members = new Collection();

    // Initialise a Guest role
    const guestRole = new GroupRole(this, -1, 'Guest', 0);
    this.roles.set(-1, guestRole);
  }

  public _update(data: { [key: string]: any }, propertyMap: { [key: string]: string }) {
    // Used to update the instance properties when a HTTP request is performed
    for (const key in data) {
      if (propertyMap[key]) {
        Object.defineProperty(this, propertyMap[key], { value: data[key], writable: true, configurable: true, enumerable: true });
      }
    }
  }

  public _getOrCreateMember(user: User, role: GroupRole) : GroupMember {
    if (this.members.get(user.userid)) {
      const member = this.members.get(user.userid)!;
      member.role = role;
      return member;
    } else {
      const member = new GroupMember(this, user, role);
      this.members.set(user.userid, member);
      return member;
    }
  }

  public _getOrCreateRole(data: { id: number, name: string, rank: number, memberCount?: number}) : GroupRole {
    if (this.roles.get(data.id)) {
      const role = this.roles.get(data.id)!;
      role.name = data.name;
      role.rank = data.rank;
      if (data.memberCount) role.cachedMemberCount = data.memberCount;
      return role;
    } else {
      const role = new GroupRole(this, data.id, data.name, data.rank);
      if (data.memberCount) role.cachedMemberCount = data.memberCount;
      this.roles.set(role.id, role);
      return role;
    }
  }

  async getMember(userid: number, allowcache: boolean = false) : Promise<GroupMember> {
    if (allowcache && this.members.get(userid)) return this.members.get(userid)!;
    // TODO: get a group membership info?
    const user = await this.client.getUser(userid);
    if (!user) throw new Error('unable to find user');

    const member = new GroupMember(this, user, new GroupRole(this, 0, 'test', 0)); // TODO: assign correct role
    return member;
  }

  join() {}
  leave() {}
  getShout() {}
  getWall() {}
  getRoles() {
    // USE PERMISSIONS ENDPOINT SO THAT ROLE PERMISSIONS CAN BE UPDATED
  }
  shout() {}
  postWall() {}
  handleJoinRequest() {}
  exile() {}

  /* Economy */
  /*public async getRevenueSummary(timeframe: RevenueTimeframe) : Promise<RevenueSummary> {
    const response = await this.client.request({ url: `https://economy.roblox.com/v1/users/${this.userid}/revenue/summary/${timeframe}`, method: 'GET' });
    if (response.status === 200) {
      return {
        stipend: response.data.recurringRobuxStipend,
        sales: response.data.itemSaleRobux,
        purchased: response.data.purchasedRobux,
        trades: response.data.tradeSystemRobux,
        pending: response.data.pendingRobux,
        payouts: response.data.groupPayoutRobux
      }
    }
    throw new Error('unable to retrieve robux information'); // TODO: what to return?
  }

  public async getTransactionHistory(type: TransactionType, limit: number = 10, pageCursor?: string) : Promise<TransactionHistory> {
    const response = await this.client.request({ url: `https://economy.roblox.com/v1/users/${this.userid}/transactions?transactionType=${type}&limit=${limit}${pageCursor ? `&cursor=${pageCursor}` : ''}`, method: 'GET' });
    if (response.status === 200) {
      return response.data; // TODO: map to a better output? Maybe convert agent to a specific class
    }
    throw new Error('unable to retrieve transaction history'); // TODO: what to return?
  }*/
}