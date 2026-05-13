import { Prisma } from '../../../generated/client';

export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',

  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (model === 'SystemConfig') return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findFirst({ model, args, query }) {
        if (model === 'SystemConfig') return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findUnique({ model, args, query }) {
        if (model === 'SystemConfig') return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async count({ model, args, query }) {
        if (model === 'SystemConfig') return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
