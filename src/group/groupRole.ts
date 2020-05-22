import { Group } from "./group";

export type GroupPostPermissions = {
  viewWall: boolean,
  postToWall: boolean,
  deleteFromWall: boolean,
  viewStatus: boolean,
  postToStatus: boolean
}
export type GroupMembershipPermissions = {
  changeRank: boolean,
  inviteMembers: boolean,
  removeMembers: boolean
}
export type GroupManagementPermissions = {
  manageRelationships: boolean,
  manageClan: boolean,
  viewAuditLogs: boolean,
}
export type GroupEconomyPermissions = {
  spendGroupFunds: boolean,
  advertiseGroup: boolean,
  createItems: boolean,
  manageItems: boolean,
  addGroupPlaces: boolean,
  manageGroupGames: boolean,
  viewGroupPayouts: boolean,
}

export type Permissions = {
  postPermissions: GroupPostPermissions,
  membershipPermissions: GroupMembershipPermissions,
  managementPermissions: GroupManagementPermissions,
  economyPermissions: GroupEconomyPermissions
}

type RobloxPermissionsObject = {
  groupPostPermissions: GroupPostPermissions,
  groupMembershipPermissions: GroupMembershipPermissions,
  groupManagementPermissions: GroupManagementPermissions,
  groupEconomyPermissions: GroupEconomyPermissions
}

export class GroupRole {
  public description?: string;
  public permissions?: Permissions;
  public cachedMemberCount?: number;

  constructor(public group: Group, public id: number, public name: string, public rank: number) {}

  public loadPermissionsFromData(data: RobloxPermissionsObject) : Permissions {
    this.permissions = {
      postPermissions: data.groupPostPermissions,
      membershipPermissions: data.groupMembershipPermissions,
      managementPermissions: data.groupManagementPermissions,
      economyPermissions: data.groupEconomyPermissions,
    }
    return this.permissions
  }

  public async getPermissions(allowcache: boolean = false) : Promise<Permissions> {
    if (allowcache && this.permissions) return this.permissions;
    const url = this.id === -1 ? `https://groups.roblox.com/v1/groups/${this.group.groupid}/roles/guest/permissions` : `https://groups.roblox.com/v1/groups/${this.group.groupid}/roles/${this.id}/permissions`
    const response = await this.group.client.request({ url, method: 'GET' });
    if (response.status === 200) {
      // Update other data
      this.name = response.data.role.name;
      this.description = response.data.role.description;
      this.rank = response.data.role.rank;
      this.permissions = this.loadPermissionsFromData(response.data.permissions)
      return this.permissions
    }
    throw new Error('unable to get role permissions')
  }

  public async updatePermissions() {}

  public async update() {}
  public async delete() {
    // TODO: MAKE SURE TO REMOVE FROM COLLECTION, AND ANY MEMBERS CONNECTED TO IT SHOULD BE UPDATED TO BE MOVED TO FIRST RANK
  }
}