import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("customers router", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);
  let customerId: number;

  it("should create a customer", async () => {
    const result = await caller.customers.create({
      name: "Test Customer",
      companyName: "Test Company",
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      pincode: "12345",
      phone: "+1234567890",
      email: "customer@test.com",
      gstNumber: "27AABCT1234H1Z0",
      notes: "Test customer",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Customer");
    customerId = result.id;
  });

  it("should list customers", async () => {
    const result = await caller.customers.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should search customers", async () => {
    const result = await caller.customers.list({ search: "Test" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get customer by id", async () => {
    const result = await caller.customers.getById(customerId);
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Customer");
  });

  it("should update customer", async () => {
    const result = await caller.customers.update({
      id: customerId,
      data: {
        name: "Updated Customer",
        phone: "+9876543210",
      },
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Updated Customer");
  });

  it("should delete customer", async () => {
    const result = await caller.customers.delete(customerId);
    expect(result).toBeDefined();
  });
});
