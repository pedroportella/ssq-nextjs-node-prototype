// Emits a hashed file and returns its URL string at build time.
const url = new URL("./QLD-Health-icons.svg", import.meta.url).toString();
export default url;
