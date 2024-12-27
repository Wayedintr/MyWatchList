// Utility function to remove undefined parameters
export const removeUndefined = (obj: Record<string, any>) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== "undefined"));
};
