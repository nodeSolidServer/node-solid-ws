import { SolidWebsocketNotificationsServer } from "../lib/notificationServer";

const JSON_LD_URI_REF = "http://www.w3.org/ns/json-ld";
const VALID_PROFILE_PARAMETERS = [
  `${JSON_LD_URI_REF}#expanded`,
  `${JSON_LD_URI_REF}#compacted`,
  `${JSON_LD_URI_REF}#context`,
  `${JSON_LD_URI_REF}#flattened`,
  `${JSON_LD_URI_REF}#frame`,
  `${JSON_LD_URI_REF}#framed`,
];

function hasJsonLDContentType(req) {
  const contentType = req.get("content-type");
  return contentType !== undefined && contentType == "application/ld+json";
}

function acceptsJsonLd(req) {
  return req.accepts("application/ld+json");
}

function hasValidJSONLDContentNegotiation(req) {
  const accept = req.get("accept");
  // make sure the "Accept" header is set in the request
  if (typeof accept !== "string" || accept === undefined) return false;
  const acceptArray = accept.split(";");
  // if it is not an array, or it is array of length 1, it cannot
  // contain "application/ld+json" and a "profile" parameter
  if (!Array.isArray(acceptArray) || acceptArray.length < 2) return false;
  const profile = acceptArray.find((item) => item.includes("profile"));
  if (profile === undefined) return false;
  // at this point the profile parameter should be of the format 'profile="some things"'
  // so find the profile param, split it, take the first index, split it again
  const jsonLDProfileParams = profile.split("=")[1].split(" ");
  // if there is just one, then check if the valid parameters
  // include it
  if (jsonLDProfileParams.length == 1) {
    return VALID_PROFILE_PARAMETERS.includes(jsonLDProfileParams);
  }
  // otherwise check 1 by 1
  return jsonLDProfileParams.some((param) =>
    VALID_PROFILE_PARAMETERS.includes(param)
  );
}

module.exports = function attachSolidNotificationServer(server, app, opts) {
  const swns = new SolidWebsocketNotificationsServer();

  if (app) {
    app.post("/*", (req, res, next) => {});

    app.head("/*", (req, res, next) => {});

    app.options("/*", (req, res, next) => {});

    app.get("/*", (req, res, next) => {});
  }
};
