// Persistence for the Todo entity, backed by the todo-db PostgreSQL instance.
// Every query here is scoped to a caller's `userId` — the resources in
// service.bal never issue one that is not.
//
// The client connects LAZILY, on first actual query, rather than at module
// init. A `postgresql:Client` constructor validates connectivity eagerly
// (measured: it errors immediately when the host refuses the connection), so
// building it at module level would crash this service's startup whenever
// the database is not yet reachable — in direct conflict with "starts with
// no required environment variables". Deferring the connection keeps startup
// unconditional; a genuinely unreachable database still surfaces as an error
// on the first request that needs it, never silently.

import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

# One stored todo row, exactly as the `todos` table holds it.
#
# + id - the row's primary key
# + userId - the owning caller's gateway subject
# + title - the todo's title
# + completed - whether the todo is done
# + createdAt - when the row was inserted
# + updatedAt - when the row was last changed
type TodoRow record {|
    string id;
    string userId;
    boolean completed;
    string title;
    time:Utc createdAt;
    time:Utc updatedAt;
|};

type CountRow record {|
    int count;
|};

function resolvePort(string raw) returns int {
    int|error parsed = int:fromString(raw);
    return parsed is int ? parsed : 5432;
}

final int todoDbPort = resolvePort(todoDbPortRaw);

isolated postgresql:Client? todoDbClientCache = ();

# The shared PostgreSQL client, connecting and creating the `todos` table on
# first call and reusing that connection pool on every call after.
#
# + return - the ready client, or an error when the database could not be
#            reached or the schema could not be applied
isolated function todoDbClient() returns postgresql:Client|error {
    lock {
        postgresql:Client? cached = todoDbClientCache;
        if cached is postgresql:Client {
            return cached;
        }
    }
    postgresql:Client newClient = check new (
        host = todoDbHost,
        username = todoDbUser,
        password = todoDbPassword,
        database = todoDbName,
        port = todoDbPort
    );
    check initTodosTable(newClient);
    lock {
        todoDbClientCache = newClient;
    }
    return newClient;
}

# Creates the `todos` table when it does not already exist.
#
# + dbClient - the client to run the DDL on
# + return - an error when the DDL could not be applied
isolated function initTodosTable(postgresql:Client dbClient) returns error? {
    sql:ParameterizedQuery createTable = `
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    _ = check dbClient->execute(createTable);
    sql:ParameterizedQuery createIndex = `
        CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos (user_id)
    `;
    _ = check dbClient->execute(createIndex);
}

# The caller's todos, one page.
#
# + userId - the caller's gateway subject
# + 'limit - page size
# + offset - rows to skip
# + return - the page's rows, in creation order, or an error
function listTodosByUser(string userId, int 'limit, int offset) returns TodoRow[]|error {
    postgresql:Client dbClient = check todoDbClient();
    sql:ParameterizedQuery q = `
        SELECT id, user_id AS "userId", title, completed,
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM todos
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
        LIMIT ${'limit} OFFSET ${offset}
    `;
    stream<TodoRow, sql:Error?> rows = dbClient->query(q);
    TodoRow[] result = [];
    check from TodoRow row in rows
        do {
            result.push(row);
        };
    check rows.close();
    return result;
}

# How many todos the caller owns in total.
#
# + userId - the caller's gateway subject
# + return - the total row count, or an error
function countTodosByUser(string userId) returns int|error {
    postgresql:Client dbClient = check todoDbClient();
    sql:ParameterizedQuery q = `SELECT COUNT(*) AS "count" FROM todos WHERE user_id = ${userId}`;
    CountRow row = check dbClient->queryRow(q);
    return row.count;
}

# One of the caller's todos, by id.
#
# + todoId - the todo's id
# + userId - the caller's gateway subject
# + return - the row, `sql:NoRowsError` when it does not exist for this
#            caller, or another error
function fetchTodoRow(string todoId, string userId) returns TodoRow|error {
    postgresql:Client dbClient = check todoDbClient();
    sql:ParameterizedQuery q = `
        SELECT id, user_id AS "userId", title, completed,
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM todos
        WHERE id = ${todoId} AND user_id = ${userId}
    `;
    return dbClient->queryRow(q);
}

# Inserts a new todo for the caller.
#
# + id - the generated id
# + userId - the caller's gateway subject
# + title - the todo's title
# + createdAt - the creation timestamp, also used as the initial updatedAt
# + return - an error when the insert failed
function insertTodo(string id, string userId, string title, time:Utc createdAt) returns error? {
    postgresql:Client dbClient = check todoDbClient();
    sql:ParameterizedQuery q = `
        INSERT INTO todos (id, user_id, title, completed, created_at, updated_at)
        VALUES (${id}, ${userId}, ${title}, FALSE, ${new sql:TimestampValue(createdAt)}, ${new sql:TimestampValue(createdAt)})
    `;
    _ = check dbClient->execute(q);
}

# Applies a title/completion edit to one of the caller's todos.
#
# + todoId - the todo's id
# + userId - the caller's gateway subject
# + title - the new title
# + completed - the new completion state
# + updatedAt - the new updatedAt timestamp
# + return - the number of rows updated (0 when the caller owns no such todo), or an error
function updateTodoRow(string todoId, string userId, string title, boolean completed, time:Utc updatedAt) returns int|error {
    postgresql:Client dbClient = check todoDbClient();
    sql:ParameterizedQuery q = `
        UPDATE todos
        SET title = ${title}, completed = ${completed}, updated_at = ${new sql:TimestampValue(updatedAt)}
        WHERE id = ${todoId} AND user_id = ${userId}
    `;
    sql:ExecutionResult result = check dbClient->execute(q);
    int? affected = result.affectedRowCount;
    return affected is int ? affected : 0;
}

# Deletes one of the caller's todos.
#
# + todoId - the todo's id
# + userId - the caller's gateway subject
# + return - the number of rows deleted (0 when the caller owns no such todo), or an error
function deleteTodoRow(string todoId, string userId) returns int|error {
    postgresql:Client dbClient = check todoDbClient();
    sql:ParameterizedQuery q = `DELETE FROM todos WHERE id = ${todoId} AND user_id = ${userId}`;
    sql:ExecutionResult result = check dbClient->execute(q);
    int? affected = result.affectedRowCount;
    return affected is int ? affected : 0;
}
