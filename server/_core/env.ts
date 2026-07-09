export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? process.env.SQLITE_PATH ?? "./data/oms.sqlite",
  isProduction: process.env.NODE_ENV === "production",
};
