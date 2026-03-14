import { z } from 'zod';
import { insertItemSchema, insertUserSchema, users, items } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  unauthorized: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    signup: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema.extend({
  email: z.string().email().refine(e => e.endsWith('@thapar.edu'), "Email must end with @thapar.edu"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  confirmPassword: z.string()
})
.refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}),
      responses: {
        201: z.custom<Omit<typeof users.$inferSelect, 'password'>>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, 'password'>>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: { 200: z.object({ message: z.string() }) }
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, 'password'>>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  items: {
    list: {
      method: 'GET' as const,
      path: '/api/items' as const,
      input: z.object({ search: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof items.$inferSelect & { seller: Omit<typeof users.$inferSelect, 'password'> }>()) }
    },
    myListings: {
      method: 'GET' as const,
      path: '/api/items/me' as const,
      responses: { 200: z.array(z.custom<typeof items.$inferSelect>()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/items/:id' as const,
      responses: {
        200: z.custom<typeof items.$inferSelect & { seller: Omit<typeof users.$inferSelect, 'password'> }>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/items' as const,
      input: insertItemSchema,
      responses: {
        201: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/items/:id' as const,
      input: insertItemSchema.partial(),
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/items/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
