import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { createTestApp, VALID_ADMIN, VALID_USER, authBearer } from "../helpers";
import { SupabaseService } from "@/common/supabase.service";
import { OrdersService } from "@/orders/orders.service";

const mockGetUser = jest.fn();
const mockFindByIdForUser = jest.fn();
const mockGetOrderItemsForUser = jest.fn();
const mockUpdateStatus = jest.fn();

jest.mock("@/orders/orders.service", () => ({
  OrdersService: jest.fn().mockImplementation(() => ({
    findByIdForUser: mockFindByIdForUser,
    getOrderItemsForUser: mockGetOrderItemsForUser,
    updateStatus: mockUpdateStatus,
  })),
}));

describe("Order ownership routes (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    (app.get(SupabaseService) as any).admin = { auth: { getUser: mockGetUser } };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockImplementation(async () => ({
      data: { user: { ...VALID_USER, app_metadata: { role: "USER" } } },
      error: null,
    }));
  });

  afterAll(async () => app.close());

  it("requires sign-in before loading an order", async () => {
    const response = await request(app.getHttpServer()).get("/orders/order-1");
    expect(response.status).toBe(401);
    expect(mockFindByIdForUser).not.toHaveBeenCalled();
  });

  it("scopes order details and items to the signed-in account", async () => {
    mockFindByIdForUser.mockResolvedValue({ id: "order-1", status: "PENDING" });
    mockGetOrderItemsForUser.mockResolvedValue([]);
    const detail = await request(app.getHttpServer()).get("/orders/order-1").set(authBearer(VALID_USER));
    const items = await request(app.getHttpServer()).get("/orders/order-1/items").set(authBearer(VALID_USER));
    expect(detail.status).toBe(200);
    expect(items.status).toBe(200);
    expect(mockFindByIdForUser).toHaveBeenCalledWith("order-1", VALID_USER.id);
    expect(mockGetOrderItemsForUser).toHaveBeenCalledWith("order-1", VALID_USER.id);
  });

  it("does not allow a regular player to change order status", async () => {
    const response = await request(app.getHttpServer()).patch("/orders/order-1/status").set(authBearer(VALID_USER)).send({ status: "CONFIRMED" });
    expect(response.status).toBe(401);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it("allows the admin order-operations role to update order status", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { ...VALID_ADMIN, app_metadata: { role: "ADMIN" } } }, error: null });
    mockUpdateStatus.mockResolvedValue({ id: "order-1", status: "SHIPPED" });
    const response = await request(app.getHttpServer()).patch("/orders/order-1/status").set(authBearer(VALID_ADMIN)).send({ status: "SHIPPED" });
    expect(response.status).toBe(200);
    expect(mockUpdateStatus).toHaveBeenCalledWith("order-1", "SHIPPED");
  });
});
