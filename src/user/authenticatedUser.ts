import { User } from "./user";
import { Client } from "./client";

type AuthenticatedUserInfo = { id: number, name: string} 

export type RevenueTimeframe = 'Day' | 'Week' | 'Month' | 'Year'
export type RevenueSummary = {
  stipend: number,
  sales: number,
  purchased: number,
  trades: number,
  pending: number,
  payouts: number
}
export type TransactionType = 'Sale' | 'Purchase' | 'AffiliateSale' |  'DevEx' | 'GroupPayout' | 'AdImpressionPayout'
export type TransactionHistoryItem = {
  created: Date,
  isPending: boolean,
  agent: {
    id: number,
    type: string,
    name: string
  },
  details: object,
  currency: {
    amount: number,
    type: string
  }
}

export type TransactionHistory = {
  previousPageCursor: string,
  nextPageCursor: string,
  data: TransactionHistoryItem[]
}

export class AuthenticatedUser extends User {
  public client: Client;
  public robux?: number;

  constructor(client: Client, info: AuthenticatedUserInfo) {
    super(client, info.id);
    this.client = client;
    this.username = info.name;
  }

  /* Economy */
  public async getRobux() : Promise<number> {
    const response = await this.client.request({ url: `https://economy.roblox.com/v1/users/${this.userid}/currency`, method: 'GET' });
    if (response.status === 200) {
      this.robux = response.data.robux;
      return this.robux!;
    }
    throw new Error('unable to retrieve robux information'); // TODO: what to return?
  }

  public async getRevenueSummary(timeframe: RevenueTimeframe) : Promise<RevenueSummary> {
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
  }

  /* Private Messages */
  public message() {}
  public getMessages() {}
  public getMessageFromId() {}
  public getMessageUnreadCount() {}
  public archiveMessages() {}
  public unarchiveMessages() {}
  public setReadMessages() {}
  public setUnreadMessages() {}

  /* Friends */
  public follow() {}
  public unfollow() {}
  public getFriendRequests() {}
  public acceptFriendRequest() {}
  public declineFriendRequest() {}
  public declineAllFriendRequests() {}
  public unfriend() {}
  public block() {}
  public unblock() {}
}