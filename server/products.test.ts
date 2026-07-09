import { describe, it, expect } from "vitest";
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("products router", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);
  let productId: number;

  it("should create a product", async () => {
    const result = await caller.products.create({
      name: "Test Product",
      category: "Electronics",
      unit: "pcs",
      rate: "1000",
      hsn: "8471",
      description: "Test product description",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Product");
    productId = result.id;
  });

  it("should list products", async () => {
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get product by id", async () => {
    const result = await caller.products.getById(productId);
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Product");
  });

  it("should update product", async () => {
    const result = await caller.products.update({
      id: productId,
      data: {
        rate: "1500",
      },
    });

    expect(result).toBeDefined();
  });

  it("should delete product", async () => {
    const result = await caller.products.delete(productId);
    expect(result).toBeDefined();
  });
});
