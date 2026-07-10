import Database from "better-sqlite3";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { InsertUser, users, customers, products, orders, orderItems, company } from "../drizzle/schema";

type Db = ReturnType<typeof drizzle>;

let _db: Db | null = null;
let _sqlite: Database.Database | null = null;

function getDatabasePath() {
  const configuredPath = process.env.DATABASE_URL || process.env.SQLITE_PATH;
  if (configuredPath) {
    return configuredPath.replace(/^file:/, "");
  }
  return path.resolve(process.cwd(), "data", "oms.sqlite");
}

function initializeSchema(sqlite: Database.Database) {
  sqlite.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
      lastSignedIn INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      gstNumber TEXT,
      footer TEXT,
      logoUrl TEXT,
      signatureUrl TEXT,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      companyName TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      phone TEXT,
      email TEXT,
      gstNumber TEXT,
      notes TEXT,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT NOT NULL,
      rate TEXT NOT NULL,
      hsn TEXT,
      description TEXT,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deliveryNumber TEXT NOT NULL UNIQUE,
      customerId INTEGER NOT NULL,
      orderDate INTEGER NOT NULL DEFAULT (unixepoch()),
      remarks TEXT,
      checkedBy TEXT,
      receiver TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      totalAmount TEXT DEFAULT '0',
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS orderItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      quantity TEXT NOT NULL,
      rate TEXT NOT NULL,
      amount TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      const dbPath = getDatabasePath();
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      _sqlite = new Database(dbPath);
      initializeSchema(_sqlite);
      _db = drizzle(_sqlite);
    } catch (error) {
      console.warn("[Database] Failed to initialize:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * CUSTOMER QUERIES
 */
export async function getCustomers(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  if (searchTerm) {
    return await db
      .select()
      .from(customers)
      .where(
        or(
          like(customers.name, `%${searchTerm}%`),
          like(customers.companyName, `%${searchTerm}%`),
          like(customers.email, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(customers.createdAt));
  }

  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCustomer(data: typeof customers.$inferInsert) {
  try {
    console.log("Customer Input:", data);

    const db = await getDb();

    if (!db) {
      throw new Error("Database is NULL");
    }

    const [created] = await db.insert(customers).values(data).returning();

    console.log("Customer Created:", created);

    return created;
  } catch (e) {
    console.error("CREATE CUSTOMER FAILED");
    console.error(e);
    throw e;
  }
}

export async function updateCustomer(id: number, data: Partial<typeof customers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
  return updated;
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning();
  return deleted;
}

/**
 * PRODUCT QUERIES
 */
export async function getProducts(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  if (searchTerm) {
    return await db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, `%${searchTerm}%`),
          like(products.category, `%${searchTerm}%`),
          like(products.hsn, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(products.createdAt));
  }

  return await db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createProduct(data: typeof products.$inferInsert) {
  try {
    console.log("Product Input:", data);

    const db = await getDb();

    if (!db) {
      throw new Error("Database is NULL");
    }

    const [created] = await db.insert(products).values(data).returning();

    console.log("Product Created:", created);

    return created;
  } catch (e) {
    console.error("CREATE PRODUCT FAILED");
    console.error(e);
    throw e;
  }
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning();
  return updated;
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  return deleted;
}

/**
 * COMPANY QUERIES
 */
export async function getCompanySettings() {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(company).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateCompanySettings(data: Partial<typeof company.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getCompanySettings();
  if (existing) {
    const [updated] = await db.update(company).set(data).where(eq(company.id, existing.id)).returning();
    return updated;
  } else {
    const [created] = await db.insert(company).values(data as typeof company.$inferInsert).returning();
    return created;
  }
}

/**
 * ORDER QUERIES
 */
export async function getOrders(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  if (searchTerm) {
    return await db
      .select()
      .from(orders)
      .where(like(orders.deliveryNumber, `%${searchTerm}%`))
      .orderBy(desc(orders.createdAt));
  }

  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrderByDeliveryNumber(deliveryNumber: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders).where(eq(orders.deliveryNumber, deliveryNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrder(data: typeof orders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [created] = await db.insert(orders).values(data).returning();
  return created;
}

export async function updateOrder(id: number, data: Partial<typeof orders.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
  return updated;
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deleted] = await db.delete(orders).where(eq(orders.id, id)).returning();
  return deleted;
}

/**
 * ORDER ITEMS QUERIES
 */
export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrderItem(data: typeof orderItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [created] = await db.insert(orderItems).values(data).returning();
  return created;
}

export async function deleteOrderItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deleted] = await db.delete(orderItems).where(eq(orderItems.id, id)).returning();
  return deleted;
}

/**
 * DELIVERY NUMBER GENERATOR
 */
export async function generateDeliveryNumber() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const lastOrder = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
  const nextNumber = (lastOrder.length > 0 ? parseInt(lastOrder[0].deliveryNumber.split("-")[2]) : 0) + 1;
  return `DM-2026-${String(nextNumber).padStart(6, "0")}`;
}
