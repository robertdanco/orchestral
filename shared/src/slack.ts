// Slack shared types

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SlackMessage {
  ts: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  text: string;
  permalink: string;
  threadTs: string | null;
  replyCount: number;
  reactions: SlackReaction[];
  mentions: string[];
  createdAt: string;
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  email?: string;
}
