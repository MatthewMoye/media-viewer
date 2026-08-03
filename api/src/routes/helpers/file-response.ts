import { access } from "node:fs/promises";

async function requireExistingPath(response, filePath, message = "File missing") {
  try {
    await access(filePath);
    return true;
  } catch {
    response.status(404).send(message);
    return false;
  }
}

function sendNotFound(response, message = "Not found") {
  response.status(404).send(message);
}

export { requireExistingPath, sendNotFound };
