import { generateDeliveryMemoPDF } from "./pdf-generator";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),

  customers: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) =>
      db.getCustomers(input?.search)
    ),
    getById: publicProcedure.input(z.number()).query(({ input }) => db.getCustomerById(input)),
    create: publicProcedure.input(z.object({
      name: z.string(),
      companyName: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      gstNumber: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ input }) => db.createCustomer(input)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        companyName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        gstNumber: z.string().optional(),
        notes: z.string().optional(),
      }),
    })).mutation(({ input }) => db.updateCustomer(input.id, input.data)),
    delete: publicProcedure.input(z.number()).mutation(({ input }) => db.deleteCustomer(input)),
  }),

  products: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) =>
      db.getProducts(input?.search)
    ),
    getById: publicProcedure.input(z.number()).query(({ input }) => db.getProductById(input)),
    create: publicProcedure.input(z.object({
      name: z.string(),
      category: z.string().optional(),
      unit: z.string(),
      rate: z.string(),
      hsn: z.string().optional(),
      description: z.string().optional(),
    })).mutation(({ input }) => db.createProduct(input)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        rate: z.string().optional(),
        hsn: z.string().optional(),
        description: z.string().optional(),
      }),
    })).mutation(({ input }) => db.updateProduct(input.id, input.data)),
    delete: publicProcedure.input(z.number()).mutation(({ input }) => db.deleteProduct(input)),
  }),

  orders: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) =>
      db.getOrders(input?.search)
    ),
    getById: publicProcedure.input(z.number()).query(({ input }) => db.getOrderById(input)),
    generateDeliveryNumber: publicProcedure.query(() => db.generateDeliveryNumber()),
    generatePDF: publicProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Fetch order and related data
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new Error("Order not found");

        const customer = await db.getCustomerById(order.customerId);
        if (!customer) throw new Error("Customer not found");

        const company = await db.getCompanySettings();
        
        // Generate PDF
        const pdfBytes = await generateDeliveryMemoPDF({
          deliveryNumber: order.deliveryNumber,
          date: new Date(order.orderDate).toLocaleDateString(),
          companyName: company?.name || "Company Name",
          companyAddress: company?.address || "",
          companyPhone: company?.phone || "",
          companyEmail: company?.email || "",
          companyGST: company?.gstNumber || "",
          footerText: company?.footer || "",
          customerName: customer.name,
          customerCompany: customer.companyName || "",
          customerAddress: customer.address || "",
          customerCity: customer.city || "",
          customerState: customer.state || "",
          customerPincode: customer.pincode || "",
          customerPhone: customer.phone || "",
          customerEmail: customer.email || "",
          customerGST: customer.gstNumber || "",
          items: [{
            description: "Order Items",
            quantity: 1,
            rate: parseFloat(order.totalAmount || "0"),
            amount: parseFloat(order.totalAmount || "0"),
          }],
          totalAmount: parseFloat(order.totalAmount || "0"),
          checkedBy: order.checkedBy || "",
          receiver: order.receiver || "",
          remarks: order.remarks || "",
        });

        return {
          success: true,
          pdf: Buffer.from(pdfBytes).toString("base64"),
        };
      }),
    create: publicProcedure.input(z.object({
      deliveryNumber: z.string(),
      customerId: z.number(),
      remarks: z.string().optional(),
      checkedBy: z.string().optional(),
      receiver: z.string().optional(),
      status: z.enum(["Pending", "Packed", "Dispatched", "Delivered"]).default("Pending"),
      totalAmount: z.string().optional(),
    })).mutation(({ input }) => db.createOrder(input)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.enum(["Pending", "Packed", "Dispatched", "Delivered"]).optional(),
        remarks: z.string().optional(),
        checkedBy: z.string().optional(),
        receiver: z.string().optional(),
        totalAmount: z.string().optional(),
      }),
    })).mutation(({ input }) => db.updateOrder(input.id, input.data)),
    delete: publicProcedure.input(z.number()).mutation(({ input }) => db.deleteOrder(input)),
  }),

  orderItems: router({
    getByOrderId: publicProcedure.input(z.number()).query(({ input }) => db.getOrderItems(input)),
    create: publicProcedure.input(z.object({
      orderId: z.number(),
      productId: z.number(),
      quantity: z.string(),
      rate: z.string(),
      amount: z.string(),
    })).mutation(({ input }) => db.createOrderItem(input)),
    delete: publicProcedure.input(z.number()).mutation(({ input }) => db.deleteOrderItem(input)),
  }),

  company: router({
    getSettings: publicProcedure.query(() => db.getCompanySettings()),
    updateSettings: publicProcedure.input(z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      gstNumber: z.string().optional(),
      footer: z.string().optional(),
      logoUrl: z.string().optional(),
      signatureUrl: z.string().optional(),
    })).mutation(({ input }) => db.updateCompanySettings(input)),
  }),
});

export type AppRouter = typeof appRouter;
