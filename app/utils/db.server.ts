import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

interface GlobalWithDB extends NodeJS.Global {
  __db__: PrismaClient | undefined;
}

declare const global: GlobalWithDB;

if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  db = global.__db__;
  db.$connect();
}

export { db };
