import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Collection from '@discordjs/collection';
import { AuthenticatedUser } from './authenticatedUser';
import { User } from './user';
import { Group } from '../group';

export type ExtraRequestOptions = {
  verification?: string,
  noCookie?: boolean,
}

export class Client {
  public user?: AuthenticatedUser;
  public users: Collection<number, User>;
  public groups: Collection<number, Group>;
  public agent: AxiosInstance
  public xcsrfToken: string | null = null;
  public cookie?: string;

  constructor() {
    this.agent = axios.create({
      xsrfHeaderName: 'X-CSRF-TOKEN'
    })
    this.users = new Collection();
    this.groups = new Collection();
  }

  public async request(options: AxiosRequestConfig, extra?: ExtraRequestOptions) {
    if (!options.headers) options.headers = {};
    options.headers['x-csrf-token'] = this.xcsrfToken;
    if (!extra || !extra.noCookie) options.headers.cookie = `.ROBLOSECURITY=${this.cookie};`;
    if (extra) {
      if (extra.verification) {
        options.headers.cookie += `__RequestVerificationToken=${extra.verification}`;
      }
    }
    return this.agent.request(options);
  }

  public _getOrCreateGroup(groupid: number) : Group {
    const group = this.groups.get(groupid) || new Group(this, groupid);
    this.groups.set(groupid, group);
    return group;
  }

  public async getCurrentUser() : Promise<AuthenticatedUser> {
    // Retrieves the currently authenticated user. Always makes a HTTP request. For cached User, access the client.user property
    const response = await this.request({ url: 'https://users.roblox.com/v1/users/authenticated', method: 'GET' });
    if (response.status === 200) {
      const user = new AuthenticatedUser(this, response.data);
      this.user = user;
      this.users.set(user.userid, user);
      return user;
    } else {
      throw new Error('Not logged in')
    }
  }

  public async getUser(userid: number, allowCache: boolean = false): Promise<AuthenticatedUser | User | null> {
    if (allowCache && this.users.get(userid)) return this.users.get(userid)!;

    const response = await this.request({ url: `https://users.roblox.com/v1/users/${userid}`, method: 'GET' });
    if (response.status === 200) {
      const user = this.users.get(userid) || new User(this, userid);
      user.username = response.data.name;
      user.description = response.data.description;
      user.created = new Date(response.data.created);
      user.banned = response.data.isBanned;
      this.users.set(user.userid, user);
      return user
    }
    return null;
  }

  public async getUsersByNames(usernames: string[], excludeBannedUsers: boolean = true, allowCache: boolean = false) : Promise<{ [username: string]: User | null }> {
    const foundUsers: { [username: string]: User | null } = {};
    if (allowCache) {
      for (const username of usernames) {
        const foundUser = this.users.find(u => u.username === username);
        if (foundUser) {
          foundUsers[username] = foundUser;
        }
      }
    }

    if (Object.keys(foundUsers).length !== usernames.length) {
      const response = await this.request({url: `https://users.roblox.com/v1/usernames/users`, method: 'POST', data: { usernames: usernames.filter(username => !foundUsers[username]), excludeBannedUsers }});
      if (response.status === 200) {
        const promises: Promise<[string, User | null]>[] = [];
        for (const obj of response.data.data) {
          promises.push(new Promise(resolve => {
            this.getUser(obj.id, allowCache).then(user => {
              if (user) {
                resolve([obj.requestedUsername, user as User]);
              } else {
                resolve([obj.requestedUsername, null])
              }
            })
          }))
        }
        const users = await Promise.all(promises);
        for (const user of users) {
          foundUsers[user[0]] = user[1];
        }
      }
    }
    return foundUsers;
  }

  public async getUserByName(username: string, allowCache: boolean = false) {
    return (await this.getUsersByNames([username]))[username];
  }

  public async login(cookie: string, doNotRepeat: boolean = false) {
    this.cookie = cookie;
    // const verificationResponse = await this.request({ url: 'https://www.roblox.com/my/account#!/security', method: 'GET' }, { noCookie: true });
    // console.log('a', verificationResponse.headers);
    // let verificationToken = verificationResponse.headers['set-cookie'].toString().match(/__RequestVerificationToken=(.*?);/);
    // if (!verificationToken || !verificationToken[1]) throw new Error('Bad cookie');
    // verificationToken = verificationToken[1];

    const xcsrfToken = await this.request({ url: 'https://api.roblox.com/sign-out/v1', method: 'POST', validateStatus: () => true });
    const xcsrf = xcsrfToken.headers['x-csrf-token'];
    if (!xcsrf) throw new Error('Unable to get X-CSRF-Token');
    this.xcsrfToken = xcsrf;

    const cookieResponse = await this.request({ url: 'https://auth.roblox.com/v2/metadata', method: 'GET' }); // , { verification: verificationToken });
    if (cookieResponse.headers['set-cookie']) {
      this.cookie = cookieResponse.headers['set-cookie'].toString().match(/\.ROBLOSECURITY=(.*?);/)[1];
    }

    // Relogin after a day if necessary
    if (!doNotRepeat) {
      setInterval(this.login, 86400000, this.cookie, true);
    }

    return await this.getCurrentUser();
  }
}