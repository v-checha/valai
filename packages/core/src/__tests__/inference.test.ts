import { describe, it, expect, expectTypeOf } from 'vitest';
import { v } from '../index.js';
import type { infer as Infer } from '../index.js';

describe('Type Inference', () => {
  describe('primitive types', () => {
    it('infers string', () => {
      const schema = v.string();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string>();
    });

    it('infers number', () => {
      const schema = v.number();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<number>();
    });

    it('infers boolean', () => {
      const schema = v.boolean();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<boolean>();
    });

    it('infers null', () => {
      const schema = v.null();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<null>();
    });

    it('infers undefined', () => {
      const schema = v.undefined();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<undefined>();
    });
  });

  describe('literal types', () => {
    it('infers string literal', () => {
      const schema = v.literal('active');
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<'active'>();
    });

    it('infers number literal', () => {
      const schema = v.literal(42);
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<42>();
    });

    it('infers boolean literal', () => {
      const schema = v.literal(true);
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<true>();
    });
  });

  describe('enum types', () => {
    it('infers enum', () => {
      const schema = v.enum(['a', 'b', 'c']);
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<'a' | 'b' | 'c'>();
    });
  });

  describe('array types', () => {
    it('infers array of primitives', () => {
      const schema = v.array(v.string());
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string[]>();
    });

    it('infers array of objects', () => {
      const schema = v.array(v.object({ name: v.string() }));
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<{ name: string }[]>();
    });
  });

  describe('object types', () => {
    it('infers object shape', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<{ name: string; age: number }>();
    });

    it('infers optional fields', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional(),
      });
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<{ name: string; age?: number | undefined }>();
    });

    it('infers nested objects', () => {
      const schema = v.object({
        user: v.object({
          profile: v.object({
            name: v.string(),
          }),
        }),
      });
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<{
        user: {
          profile: {
            name: string;
          };
        };
      }>();
    });
  });

  describe('nullable and optional', () => {
    it('infers nullable', () => {
      const schema = v.string().nullable();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string | null>();
    });

    it('infers optional', () => {
      const schema = v.string().optional();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string | undefined>();
    });

    it('infers nullable and optional', () => {
      const schema = v.string().nullable().optional();
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string | null | undefined>();
    });
  });

  describe('default values', () => {
    it('default removes undefined from output', () => {
      const schema = v.string().default('default');
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string>();
    });
  });

  describe('union types', () => {
    it('infers union', () => {
      const schema = v.union([v.string(), v.number()]);
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<string | number>();
    });

    it('infers discriminated union', () => {
      const schema = v.discriminatedUnion('type', [
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() }),
      ]);
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<
        { type: 'a'; value: string } | { type: 'b'; count: number }
      >();
    });
  });

  describe('tuple types', () => {
    it('infers tuple', () => {
      const schema = v.tuple([v.string(), v.number()]);
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<[string, number]>();
    });
  });

  describe('record types', () => {
    it('infers record', () => {
      const schema = v.record(v.number());
      type T = Infer<typeof schema>;
      expectTypeOf<T>().toEqualTypeOf<Record<string, number>>();
    });
  });

  describe('complex nested types', () => {
    it('infers complex schema', () => {
      const schema = v.object({
        id: v.string().uuid(),
        name: v.string().min(1),
        email: v.string().email().optional(),
        roles: v.array(v.enum(['admin', 'user', 'guest'])),
        metadata: v.record(v.unknown()),
        settings: v.object({
          theme: v.enum(['light', 'dark']).default('light'),
          notifications: v.boolean().default(true),
        }),
      });

      type T = Infer<typeof schema>;

      expectTypeOf<T>().toEqualTypeOf<{
        id: string;
        name: string;
        email?: string | undefined;
        roles: ('admin' | 'user' | 'guest')[];
        metadata: Record<string, unknown>;
        settings: {
          theme: 'light' | 'dark';
          notifications: boolean;
        };
      }>();
    });
  });
});
