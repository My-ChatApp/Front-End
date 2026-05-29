const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID_REGEX.test(value.trim());

export const parseUuidList = (raw: string): string[] =>
  raw
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
