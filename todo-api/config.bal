// All environment-driven settings for this service, read once here.
//
// GATEWAY_ASSERTION_CERTIFICATE / _ISSUER / _HEADER are intentionally NOT
// read here: gateway_assertion.bal (copied verbatim from the `ballerina`
// skill) reads those three itself and panics its interceptor's init when any
// is missing. That fail-closed startup is deliberate — this service must
// never be able to mistake a forged assertion for a real one — so it is not
// softened with a local default here.
//
// TODO_DB_* wire the todo-db platform-resource. Each falls back to a
// sensible local default so the service still starts with no environment
// variables set at all, per the component contract.
import ballerina/os;

# The named environment variable's value, or `defaultValue` when unset/blank.
#
# + name - the environment variable name to read
# + defaultValue - the value to use when the environment variable is unset or blank
# + return - the resolved setting
function envOrDefault(string name, string defaultValue) returns string {
    string envValue = os:getEnv(name);
    return envValue.trim() == "" ? defaultValue : envValue;
}

configurable string todoDbHost = envOrDefault("TODO_DB_HOST", "localhost");
configurable string todoDbPortRaw = envOrDefault("TODO_DB_PORT", "5432");
configurable string todoDbUser = envOrDefault("TODO_DB_USER", "postgres");
configurable string todoDbPassword = envOrDefault("TODO_DB_PASSWORD", "postgres");
configurable string todoDbName = envOrDefault("TODO_DB_DBNAME", "todo_db");
