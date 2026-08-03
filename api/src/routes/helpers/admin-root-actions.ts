import { requestLibraryRescan } from "../../services/library-scanner.js";

function redirectWithMessage(response, message, type = "success") {
  const params = new URLSearchParams({ message, type });
  response.redirect(`/?${params.toString()}`);
}

function handleRescan(request, response, next) {
  try {
    const result = requestLibraryRescan();
    const message = result.queued
      ? "A rescan is already running. Another scan was queued."
      : "Library rescan started in background.";
    redirectWithMessage(response, message);
  } catch (error) {
    next(error);
  }
}

function runRootMutation(response, action, successMessageBuilder) {
  try {
    action();
    const result = requestLibraryRescan();
    const suffix = result.queued
      ? " Rescan queued (another scan is already running)."
      : " Rescan started in background.";
    redirectWithMessage(response, `${successMessageBuilder()}${suffix}`);
  } catch (error) {
    redirectWithMessage(response, error.message, "error");
  }
}

export { redirectWithMessage, handleRescan, runRootMutation };
