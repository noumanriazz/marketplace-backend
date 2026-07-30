/**
 * Converts a value to a plain ETH decimal string (no scientific notation).
 * @param {unknown} value
 * @returns {string}
 */
const toEthString = (value) => {
  if (value == null || value === "") {
    return "0";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return "0";
    }

    if (/[eE]/.test(trimmed)) {
      return expandScientific(trimmed);
    }

    return trimmed;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "0";
    }

    const asString = String(value);

    if (/[eE]/.test(asString)) {
      return expandScientific(value.toFixed(18).replace(/\.?0+$/, "") || "0");
    }

    return asString;
  }

  return toEthString(String(value));
};

/**
 * Expands a scientific notation string into a plain decimal string.
 * @param {string} value
 * @returns {string}
 */
const expandScientific = (value) => {
  const str = String(value).trim();

  if (!/[eE]/.test(str)) {
    return str;
  }

  const [base, expStr] = str.split(/[eE]/);
  const exp = parseInt(expStr, 10);
  const sign = base.startsWith("-") ? "-" : "";
  const absBase = base.replace("-", "");
  const [intPart, fracPart = ""] = absBase.split(".");
  const digits = `${intPart}${fracPart}`;

  if (exp >= 0) {
    const pad = exp - fracPart.length;
    return `${sign}${digits}${pad > 0 ? "0".repeat(pad) : ""}`;
  }

  const decimalPos = intPart.length + exp;

  if (decimalPos <= 0) {
    return `${sign}0.${"0".repeat(-decimalPos)}${digits}`;
  }

  return `${sign}${digits.slice(0, decimalPos)}.${digits.slice(decimalPos)}`;
};

module.exports = {
  toEthString,
};
