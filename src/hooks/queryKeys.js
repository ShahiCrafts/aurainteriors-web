export const cartKeys = {
  all: ["cart"],
  list: (userId) => ["cart", "list", userId || "guest"],
};

export const addressKeys = {
  all: ["addresses"],
  list: (userId) => ["addresses", userId || "guest"],
  detail: (id, userId) => ["address", id, userId || "guest"],
};
