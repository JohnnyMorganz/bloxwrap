import { Group } from "./group";

type RobloxAuditLogActionObject = {
  actor: {
    user: {
      userId: number,
      username: string
    },
    role: {
      id: 0,
      name: string,
      description: string,
      rank: 0,
      memberCount: 0
    }
  },
  actionType: string,
  description: object,
  created: string
}

export class AuditLogAction {
  constructor(public group: Group, data: RobloxAuditLogActionObject) {}
}