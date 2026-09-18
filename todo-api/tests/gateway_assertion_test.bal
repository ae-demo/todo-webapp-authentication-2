// Tests for the gateway's signed assertion (gateway_assertion.bal, copied
// verbatim from the `ballerina` skill). Everything is minted against a
// throwaway RSA keypair in tests/resources/ — nothing here talks to a real
// gateway or IdP. GATEWAY_ASSERTION_CERTIFICATE / _ISSUER / _HEADER must be
// exported to match tests/resources/gw_valid_cert.pem and the constants
// below before `bal test` runs (the interceptor reads them at module init,
// when the listener attaches, which happens before any test function runs).
//
// This contract (openapi.yaml) declares no `security: []` operation — every
// `/me/todos` operation needs an identity — so there is no endpoint to prove
// the "public resource, no assertion, still 200" case against. In its place
// this file proves the case the contract DOES make: a request with no
// assertion at all is rejected with 401 (the issue's own acceptance
// criterion), and that the interceptor never downgrades an unverifiable
// assertion to an anonymous caller.

import ballerina/http;
import ballerina/jwt;
import ballerina/lang.array;
import ballerina/test;

const string TEST_ISSUER = "aep-gateway-test";
const string TEST_HEADER = "x-jwt-assertion";
const string VALID_KEY_FILE = "tests/resources/gw_valid_private.pem";
const string WRONG_KEY_FILE = "tests/resources/gw_wrong_private.pem";

final http:Client gatewayTestClient = check new ("http://localhost:9090");

function mintAssertion(string keyFile, string issuer, string subject, string scope) returns string|error {
    jwt:IssuerConfig config = {
        issuer: issuer,
        username: subject,
        expTime: 300,
        customClaims: {"scope": scope},
        signatureConfig: {
            config: {keyFile: keyFile, keyPassword: ""}
        }
    };
    return jwt:issue(config);
}

function base64UrlDecode(string segment) returns byte[]|error {
    string standard = re `-`.replaceAll(segment, "+");
    standard = re `_`.replaceAll(standard, "/");
    int remainder = standard.length() % 4;
    if remainder == 2 {
        standard = standard + "==";
    } else if remainder == 3 {
        standard = standard + "=";
    }
    return array:fromBase64(standard);
}

function base64UrlEncode(byte[] data) returns string {
    string standard = data.toBase64();
    standard = re `\+`.replaceAll(standard, "-");
    standard = re `/`.replaceAll(standard, "_");
    return re `=+$`.replaceAll(standard, "");
}

# Flips the `sub` claim after signing, without touching the signature — the
# case a forged header cannot fake, and the one the interceptor must never
# downgrade to "anonymous".
#
# + token - a validly-signed compact JWT
# + return - the same token with its payload edited and its signature left as-is, or an error
function tamperPayload(string token) returns string|error {
    string[] parts = re `\.`.split(token);
    if parts.length() != 3 {
        return error("not a compact JWT: " + token);
    }
    byte[] payloadBytes = check base64UrlDecode(parts[1]);
    string payloadJson = check string:fromBytes(payloadBytes);
    json payload = check payloadJson.fromJsonString();
    map<json> payloadMap = check payload.ensureType();
    payloadMap["sub"] = "attacker";
    string tamperedSegment = base64UrlEncode(payloadMap.toJsonString().toBytes());
    return parts[0] + "." + tamperedSegment + "." + parts[2];
}

// Every case below posts an empty title to POST /me/todos rather than
// listing or creating a real todo: title validation runs BEFORE this service
// ever opens a database connection, so a verified-but-invalid request comes
// back 400 (proving the caller resolved and reached business logic) without
// this test suite needing a live todo-db. `bal build && bal test` must pass
// with no environment configured at all, and a real database is provisioned
// only once this component is deployed.
final json emptyTitleBody = {"title": ""};

@test:Config {}
function testValidAssertionIsAccepted() returns error? {
    string token = check mintAssertion(VALID_KEY_FILE, TEST_ISSUER, "user-1", "todos:read todos:submit");
    http:Response resp = check gatewayTestClient->post("/me/todos", emptyTitleBody, {[TEST_HEADER]: token});
    // 400 (not 401) shows the assertion verified and the request reached
    // this service's own validation — the only question left to it.
    test:assertEquals(resp.statusCode, 400);
}

@test:Config {}
function testAssertionSignedByWrongKeyIsRejected() returns error? {
    string token = check mintAssertion(WRONG_KEY_FILE, TEST_ISSUER, "user-1", "todos:read todos:submit");
    http:Response resp = check gatewayTestClient->post("/me/todos", emptyTitleBody, {[TEST_HEADER]: token});
    test:assertEquals(resp.statusCode, 401);
}

@test:Config {}
function testTamperedAssertionIsRejected() returns error? {
    string original = check mintAssertion(VALID_KEY_FILE, TEST_ISSUER, "user-1", "todos:read todos:submit");
    string tampered = check tamperPayload(original);
    http:Response resp = check gatewayTestClient->post("/me/todos", emptyTitleBody, {[TEST_HEADER]: tampered});
    test:assertEquals(resp.statusCode, 401);
}

@test:Config {}
function testMissingAssertionIsRejected() returns error? {
    http:Response resp = check gatewayTestClient->post("/me/todos", emptyTitleBody, {});
    test:assertEquals(resp.statusCode, 401);
}
