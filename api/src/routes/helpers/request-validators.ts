import path from "node:path";

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseIdParam(request, response, name = "id") {
  const value = parsePositiveInt(request.params[name]);

  if (value === null) {
    response.status(400).send("Invalid ID");
    return null;
  }

  return value;
}

function resolveSafePath(inputPath) {
  return path.resolve(inputPath);
}

export { parseIdParam, resolveSafePath };
