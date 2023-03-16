import { PrismaService } from './../../../../prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Session, User } from '@prisma/client';

@Injectable()
export class SessionManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string, token: string) {
    const session = await this.prisma.session.create({
      data: {
        token,
        User: {
          connect: {
            id: userId,
          },
        },
      },

      include: {
        User: true,
      },
    });

    if (!session) {
      throw new Error('session_not_created');
    }
  }

  async createSessionAndOverride(userId: string, token: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new Error('user_not_found');

      if (user.sessions.length > 2) {
        await ctx.session.delete({
          where: {
            id: user.sessions[0].id,
          },
        });
      }

      const session = await ctx.session.create({
        data: {
          token,
          User: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          User: true,
        },
      });

      return session;
    });
  }

  async updateSession(userId: string, token: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new Error('user_not_found');

      const session = await ctx.session.update({
        where: {
          id: user.sessions[0].id,
        },
        data: {
          token,
        },
      });

      if (!session) throw new Error('session_not_updated');

      return session;
    });
  }

  async deleteSession(id: string) {
    const session = await this.prisma.session.delete({
      where: {
        id,
      },
    });

    if (!session) {
      throw new Error('session_not_deleted');
    }
  }

  async findSession(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId: {
          equals: userId,
        },
      },
    });

    if (!sessions) throw new Error('session_not_found');

    return sessions;
  }

  async findSessionByUser(userId: string, token: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new ForbiddenException('user_not_found');

      const session = user.sessions.find(session => session.token === token);

      if (!session) throw new Error('session_not_found');

      return user;
    });
  }
}
