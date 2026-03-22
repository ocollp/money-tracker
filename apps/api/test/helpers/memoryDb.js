export function createMemoryDb() {
  const users = new Map();

  return {
    collection(name) {
      if (name !== 'users') {
        return {
          async findOne() {
            return null;
          },
          async insertOne() {},
          async updateOne() {},
        };
      }
      return {
        async findOne(query) {
          if (!query?.googleSub) return null;
          const u = users.get(query.googleSub);
          return u ? { ...u, settings: u.settings ? { ...u.settings } : u.settings } : null;
        },
        async insertOne(doc) {
          users.set(String(doc.googleSub), {
            ...doc,
            settings: doc.settings ? { ...doc.settings } : doc.settings,
          });
        },
        async updateOne(filter, update) {
          const key = filter?.googleSub;
          if (!key) return;
          const prev = users.get(key);
          if (!prev) return;
          const $set = update?.$set;
          if (!$set) return;
          for (const [k, v] of Object.entries($set)) {
            prev[k] = v;
          }
        },
      };
    },
  };
}
