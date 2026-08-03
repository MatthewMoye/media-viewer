const { rescanLibrary } = require("../../services/library-scanner");

function redirectWithMessage(response, message, type = "success") {
  const params = new URLSearchParams({ message, type });
  response.redirect(`/?${params.toString()}`);
}

function handleRescan(request, response, next) {
  try {
    rescanLibrary();
    redirectWithMessage(response, "Library rescan started and completed.");
  } catch (error) {
    next(error);
  }
}

function runRootMutation(response, action, successMessageBuilder) {
  try {
    action();
    const fileCount = rescanLibrary();
    redirectWithMessage(response, successMessageBuilder(fileCount));
  } catch (error) {
    redirectWithMessage(response, error.message, "error");
  }
}

module.exports = {
  redirectWithMessage,
  handleRescan,
  runRootMutation,
};
