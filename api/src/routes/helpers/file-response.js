const fs = require("node:fs");

function requireExistingPath(response, filePath, message = "File missing") {
  if (fs.existsSync(filePath)) {
    return true;
  }

  response.status(404).send(message);
  return false;
}

function sendNotFound(response, message = "Not found") {
  response.status(404).send(message);
}

module.exports = {
  requireExistingPath,
  sendNotFound,
};
