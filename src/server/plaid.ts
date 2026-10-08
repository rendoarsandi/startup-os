import { z } from "zod";

const accountSchema = z.object({
  account_id: z.string(),
  name: z.string(),
  type: z.string(),
  subtype: z.string().nullable().optional(),
  balances: z.object({
    current: z.number().nullable(),
    iso_currency_code: z.string().nullable().optional(),
  }),
});
const transactionSchema = z.object({
  transaction_id: z.string(),
  account_id: z.string(),
  amount: z.number(),
  date: z.string(),
  name: z.string(),
  merchant_name: z.string().nullable().optional(),
  category: z.array(z.string()).nullable().optional(),
  pending: z.boolean().optional(),
});
export type BankAccount = z.infer<typeof accountSchema>;
export type BankTransaction = z.infer<typeof transactionSchema>;

export class PlaidService {
  private readonly config: {
    clientId: string;
    secret: string;
    environment?: string;
  };
  private readonly baseUrl: string;
  constructor(config: {
    clientId: string;
    secret: string;
    environment?: string;
  }) {
    this.config = config;
    const environment = z
      .enum(["sandbox", "development", "production"])
      .parse(config.environment || "sandbox");
    this.baseUrl = `https://${environment}.plaid.com`;
  }
  private async request<T>(
    path: string,
    input: object,
    schema: z.ZodType<T>,
  ): Promise<T> {
    if (!this.config.clientId || !this.config.secret)
      throw new Error("Banking is not connected.");
    const response = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.config.clientId,
        secret: this.config.secret,
        ...input,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw new Error(
        "Your bank connection could not complete the request. Reconnect or try again.",
      );
    return schema.parse(await response.json());
  }
  async createLinkToken(userId: string) {
    const response = await this.request(
      "/link/token/create",
      {
        user: { client_user_id: userId },
        client_name: "Startup OS",
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
      },
      z.object({ link_token: z.string() }),
    );
    return response.link_token;
  }
  async exchangePublicToken(publicToken: string) {
    if (publicToken.startsWith("mock_"))
      throw new Error("A real Plaid Link token is required.");
    const response = await this.request(
      "/item/public_token/exchange",
      { public_token: publicToken },
      z.object({ access_token: z.string(), item_id: z.string() }),
    );
    return { accessToken: response.access_token, itemId: response.item_id };
  }
  async getAccounts(accessToken: string) {
    const response = await this.request(
      "/accounts/balance/get",
      { access_token: accessToken },
      z.object({ accounts: z.array(accountSchema) }),
    );
    return response.accounts;
  }
  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
  ) {
    const transactions: BankTransaction[] = [];
    for (let page = 0; page < 20; page++) {
      const response = await this.request(
        "/transactions/get",
        {
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: { count: 500, offset: transactions.length },
        },
        z.object({
          transactions: z.array(transactionSchema),
          total_transactions: z.number().int().nonnegative(),
        }),
      );
      transactions.push(...response.transactions);
      if (transactions.length >= response.total_transactions)
        return transactions.filter((transaction) => !transaction.pending);
      if (!response.transactions.length) break;
    }
    throw new Error(
      "The transaction import is too large. Narrow the import window before retrying.",
    );
  }
}
