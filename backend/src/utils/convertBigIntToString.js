function convertBigIntToString(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (obj instanceof Date) {
    return obj.toISOString();
  } else if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (typeof obj[key] === "bigint") {
        newObj[key] = obj[key].toString();
      } else {
        newObj[key] = convertBigIntToString(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

export default convertBigIntToString;
