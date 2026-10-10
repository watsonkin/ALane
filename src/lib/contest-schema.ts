import { z } from "zod";

/**
 * Contest record stored as Git-CMS YAML in `data/contests/*.yaml`.
 * Field set matches the M0 technical proposal. Ingest adapters are not
 * implemented yet: `source_adapters`, `last_fetched_at`, and `content_hash`
 * are recorded so later jobs have a place to write, and stay empty until then.
 */

const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "只能使用小写字母、数字和连字符",
  );

const httpUrlSchema = z
  .string()
  .url("必须是合法 URL")
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    "只接受 http 或 https 链接",
  );

/** ISO 8601 with an explicit offset (`Z` or `+08:00`). */
const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: "需要带时区的 ISO 8601 时间" });

export const contestStatusSchema = z.enum(["draft", "published", "archived"]);
export const contestHealthSchema = z.enum(["ok", "warn", "dead"]);
export const feeTierSchema = z.enum(["free", "paid", "mixed", "unknown"]);
export const streetPhotoRelevanceSchema = z.enum([
  "core",
  "adjacent",
  "unreviewed",
]);
export const rightsTagSchema = z.enum([
  "transfer_copyright",
  "exclusive",
  "no_payment",
  "moral_rights_waived",
]);
export const sourceAdapterKindSchema = z.enum([
  "manual",
  "jsonld",
  "html",
  "api",
]);

export const geoSchema = z.object({
  label: z.string().min(1, "geo.label 不能为空"),
  country: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
});

export const galleryUrlSchema = z.object({
  url: httpUrlSchema,
  label: z.string().min(1).optional(),
  edition: z.string().min(1).optional(),
});

export const sourceAdapterSchema = z.object({
  id: z.string().min(1, "source adapter 需要 id"),
  kind: sourceAdapterKindSchema.default("manual"),
});

export const contestSchema = z
  .object({
    id: slugSchema,
    slug: slugSchema,
    name: z.string().min(1, "name 不能为空"),
    official_url: httpUrlSchema,
    status: contestStatusSchema,
    open_at: isoDateTimeSchema.nullable(),
    deadline_at: isoDateTimeSchema.nullable(),
    announce_at: isoDateTimeSchema.nullable(),
    edition: z.string().min(1).nullable(),
    geo: geoSchema.nullable(),
    online: z.boolean(),
    fee: feeTierSchema,
    street_photo_relevance: streetPhotoRelevanceSchema,
    rights_tags: z.array(rightsTagSchema),
    gallery_urls: z.array(galleryUrlSchema),
    source_adapters: z.array(sourceAdapterSchema),
    last_fetched_at: isoDateTimeSchema.nullable(),
    content_hash: z.string().min(1).nullable(),
    health: contestHealthSchema,
  })
  .strict()
  .superRefine((contest, ctx) => {
    if (
      contest.open_at &&
      contest.deadline_at &&
      Date.parse(contest.deadline_at) <= Date.parse(contest.open_at)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline_at"],
        message: "deadline_at 必须晚于 open_at",
      });
    }

    if (!contest.online && contest.geo === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geo"],
        message: "非纯线上赛事必须填写 geo；纯线上请把 online 设为 true",
      });
    }
  });

export type Contest = z.infer<typeof contestSchema>;
export type ContestStatus = z.infer<typeof contestStatusSchema>;
export type ContestHealth = z.infer<typeof contestHealthSchema>;
export type FeeTier = z.infer<typeof feeTierSchema>;
export type StreetPhotoRelevance = z.infer<typeof streetPhotoRelevanceSchema>;
export type RightsTag = z.infer<typeof rightsTagSchema>;
export type SourceAdapterKind = z.infer<typeof sourceAdapterKindSchema>;
export type GalleryUrl = z.infer<typeof galleryUrlSchema>;
