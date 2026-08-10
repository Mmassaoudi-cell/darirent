import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    role: text("role", { enum: ["renter", "owner", "admin"] })
      .notNull()
      .default("renter"),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email").notNull(),
    identityVerifiedAt: integer("identity_verified_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("idx_users_email").on(table.email)],
);

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull().default("Tunis"),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    priceDt: integer("price_dt").notNull(),
    depositDt: integer("deposit_dt").notNull().default(0),
    agencyFeeDt: integer("agency_fee_dt").notNull().default(0),
    sizeM2: integer("size_m2").notNull(),
    rooms: text("rooms").notNull(),
    furnished: integer("furnished", { mode: "boolean" })
      .notNull()
      .default(false),
    parking: integer("parking", { mode: "boolean" })
      .notNull()
      .default(false),
    elevator: integer("elevator", { mode: "boolean" })
      .notNull()
      .default(false),
    description: text("description").notNull().default(""),
    status: text("status", {
      enum: ["draft", "published", "rented", "archived"],
    })
      .notNull()
      .default("draft"),
    isPreview: integer("is_preview", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_properties_status_created").on(table.status, table.createdAt),
    index("idx_properties_neighborhood_status").on(
      table.neighborhood,
      table.status,
    ),
    index("idx_properties_rooms_price").on(table.rooms, table.priceDt),
    index("idx_properties_owner_status").on(table.ownerId, table.status),
  ],
);

export const propertyImages = sqliteTable(
  "property_images",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    objectKey: text("object_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    source: text("source", {
      enum: ["owner_upload", "ai_inspection"],
    })
      .notNull()
      .default("owner_upload"),
    createdAt: createdAt(),
  },
  (table) => [index("idx_property_images_property_sort").on(table.propertyId, table.sortOrder)],
);

export const inspections = sqliteTable(
  "inspections",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coveragePct: integer("coverage_pct").notNull(),
    aiFindings: text("ai_findings", { mode: "json" })
      .$type<{
        rooms: Array<{ room: string; status: string; coverage: number }>;
        issues: Array<{
          room: string;
          label: string;
          confidence: number;
          recommendation: string;
        }>;
      }>()
      .notNull(),
    disclaimerAck: integer("disclaimer_ack", { mode: "boolean" }).notNull(),
    modelVersion: text("model_version").notNull().default("coverage-rules-v1"),
    createdAt: createdAt(),
  },
  (table) => [index("idx_inspections_property_created").on(table.propertyId, table.createdAt)],
);

export const inspectionMedia = sqliteTable(
  "inspection_media",
  {
    id: text("id").primaryKey(),
    inspectionId: text("inspection_id")
      .notNull()
      .references(() => inspections.id, { onDelete: "cascade" }),
    room: text("room").notNull(),
    objectKey: text("object_key").notNull(),
    sha256: text("sha256").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("idx_inspection_media_inspection").on(table.inspectionId)],
);

export const opportunityScores = sqliteTable(
  "opportunity_scores",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    priceValue: integer("price_value").notNull(),
    conditionScore: integer("condition_score").notNull(),
    trustScore: integer("trust_score").notNull(),
    locationFit: integer("location_fit").notNull(),
    composite: integer("composite").notNull(),
    modelVersion: text("model_version").notNull(),
    computedAt: integer("computed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_opportunity_scores_property_computed").on(table.propertyId, table.computedAt)],
);

export const savedSearches = sqliteTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("My rental search"),
    filters: text("filters", { mode: "json" })
      .$type<Record<string, string | number | boolean>>()
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("idx_saved_searches_user_created").on(table.userId, table.createdAt)],
);

export const alertsSent = sqliteTable(
  "alerts_sent",
  {
    id: text("id").primaryKey(),
    savedSearchId: text("saved_search_id")
      .notNull()
      .references(() => savedSearches.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["email", "sms", "in_app"] })
      .notNull()
      .default("in_app"),
    sentAt: integer("sent_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("idx_alerts_saved_property_channel").on(
      table.savedSearchId,
      table.propertyId,
      table.channel,
    ),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => users.id, { onDelete: "set null" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    channel: text("channel", { enum: ["in_app", "whatsapp_click"] })
      .notNull()
      .default("in_app"),
    createdAt: createdAt(),
  },
  (table) => [
    index("idx_messages_property_created").on(table.propertyId, table.createdAt),
    index("idx_messages_recipient_created").on(table.recipientId, table.createdAt),
  ],
);

export const verificationRequests = sqliteTable(
  "verification_requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    identityObjectKey: text("identity_object_key").notNull(),
    propertyProofObjectKey: text("property_proof_object_key").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    reviewNote: text("review_note"),
    createdAt: createdAt(),
  },
  (table) => [index("idx_verification_requests_user_status").on(table.userId, table.status)],
);

export const propertyViews = sqliteTable(
  "property_views",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionHash: text("session_hash"),
    createdAt: createdAt(),
  },
  (table) => [index("idx_property_views_property_created").on(table.propertyId, table.createdAt)],
);
