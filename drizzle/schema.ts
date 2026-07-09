import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Local admin user shape used by the standalone app.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Company Settings table - stores company configuration and branding
 */
export const company = sqliteTable("company", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  gstNumber: text("gstNumber"),
  footer: text("footer"),
  logoUrl: text("logoUrl"),
  signatureUrl: text("signatureUrl"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type Company = typeof company.$inferSelect;
export type InsertCompany = typeof company.$inferInsert;

/**
 * Customers table - stores customer information
 */
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  companyName: text("companyName"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  gstNumber: text("gstNumber"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Products table - stores product information
 */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category"),
  unit: text("unit").notNull(), // e.g., "pcs", "kg", "ltr"
  rate: text("rate").notNull(),
  hsn: text("hsn"), // HSN code for GST
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders table - stores delivery memo orders
 */
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deliveryNumber: text("deliveryNumber").notNull().unique(), // DM-2026-000001
  customerId: integer("customerId").notNull(),
  orderDate: integer("orderDate", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  remarks: text("remarks"),
  checkedBy: text("checkedBy"),
  receiver: text("receiver"),
  status: text("status", { enum: ["Pending", "Packed", "Dispatched", "Delivered"] }).default("Pending").notNull(),
  totalAmount: text("totalAmount").default("0"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * OrderItems table - stores individual items in an order
 */
export const orderItems = sqliteTable("orderItems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  quantity: text("quantity").notNull(),
  rate: text("rate").notNull(),
  amount: text("amount").notNull(), // quantity * rate
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Relations for Drizzle ORM
 */
export const ordersRelations = relations(orders, ({ many, one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));
