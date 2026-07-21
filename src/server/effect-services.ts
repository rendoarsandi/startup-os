import { Context, Layer } from "effect";
import { GeminiService } from "./gemini";
import { PlaidService } from "./plaid";
import { AnalysisService } from "./analysis";

export class GeminiServiceTag extends Context.Tag("GeminiService")<
  GeminiServiceTag,
  GeminiService
>() {}

export class PlaidServiceTag extends Context.Tag("PlaidService")<
  PlaidServiceTag,
  PlaidService
>() {}

export class AnalysisServiceTag extends Context.Tag("AnalysisService")<
  AnalysisServiceTag,
  AnalysisService
>() {}

export class DbTag extends Context.Tag("Database")<
  DbTag,
  any
>() {}

export const makeGeminiLayer = (apiKey: string) =>
  Layer.succeed(GeminiServiceTag, new GeminiService(apiKey));

export const makePlaidLayer = (config: any) =>
  Layer.succeed(PlaidServiceTag, new PlaidService(config));

export const makeAnalysisLayer = (db: any) =>
  Layer.succeed(AnalysisServiceTag, new AnalysisService(db));

export const makeDbLayer = (db: any) =>
  Layer.succeed(DbTag, db);
