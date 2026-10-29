export const formatDate = (dateStr) => {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
};

export const getContentRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

export const getContentSections = (payload) => {
  if (payload && typeof payload === "object" && !Array.isArray(payload?.sections) && payload?.sections) {
    return payload.sections;
  }

  const rows = getContentRows(payload);
  return rows.reduce((acc, item) => {
    if (item?.section) acc[item.section] = item;
    return acc;
  }, {});
};

