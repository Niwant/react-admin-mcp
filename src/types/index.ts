import { z } from 'zod';

export const GetSchemasParams = z.object({});
export type GetSchemasParams = z.infer<typeof GetSchemasParams>;

export const GenerateParams = z.object({
  collection: z.string(),
  fields: z.record(z.string(), z.string()),
});
export type GenerateParams = z.infer<typeof GenerateParams>;

export const UpdateObjectParams = z.object({
  collection: z.string(),
  id: z.string(),
  updates: z.record(z.any()),
});
export type UpdateObjectParams = z.infer<typeof UpdateObjectParams>;

export const GetObjectsParams = z.object({
  collection: z.string(),
  filter: z.record(z.any()).optional(),
});
export type GetObjectsParams = z.infer<typeof GetObjectsParams>; 