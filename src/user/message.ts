import { User } from "./user"
import { Client } from "./client";

type RobloxUserObject = {
  id: number,
  name: string,
  displayName: string
}

type RobloxMessageData = {
  id: number,
  sender: RobloxUserObject,
  recipient: RobloxUserObject
  subject: string,
  body: string,
  created: string,
  updated: string,
  isRead: boolean,
  isSystemMessage: boolean,
  isReportAbuseDisplayed: boolean
}

export class Message {
  public id: number;
  public sender: User | RobloxUserObject;
  public recipient: User | RobloxUserObject;
  public subject: string;
  public body: string;
  public created: Date;
  public updated: Date;
  public read: boolean;
  public isSystemMessage: boolean;

  constructor(public client: Client, data: RobloxMessageData) {
    this.id = data.id;
    this.sender = data.sender;
    this.recipient = data.recipient
    this.subject = data.subject;
    this.body = data.body;
    this.created = new Date(data.created);
    this.updated = new Date(data.updated);
    this.read = data.isRead;
    this.isSystemMessage = data.isSystemMessage;
  }

  async loadUsers() {
    if (!(this.sender instanceof User)) this.sender = (await this.client.getUser(this.sender.id, true)) as User;
    if (!(this.recipient instanceof User)) this.recipient = (await this.client.getUser(this.recipient.id, true)) as User;
  }
}