// Implements specs/design/components/todo-api/openapi.yaml exactly: same
// paths, schemas and status codes. Scaffolded with
// `bal openapi -i openapi.yaml --mode service --single-file`, then filled in.
//
// Every resource resolves the caller through the gateway's signed assertion
// (gateway_assertion.bal) and never trusts a client-supplied header. The
// gateway has already enforced todos:read / todos:submit per operation, so no
// handler here holds a scope check of its own — the only question left to
// this service is "is this row the caller's", answered by scoping every query
// to the caller's `userId` (api-management).

import ballerina/http;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {

    public function createInterceptors() returns AssertionInterceptor => new;

    # Delete the caller's todo
    #
    # + return - returns can be any of following types
    # http:NoContent (Deleted)
    # http:NotFound (No such todo for the caller)
    # http:Unauthorized (Missing or invalid token)
    resource function delete me/todos/[string todoId](http:RequestContext ctx)
            returns http:NoContent|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int affected = check deleteTodoRow(todoId, caller.userId);
        if affected == 0 {
            return <ErrorNotFound>{body: {code: 404, message: "todo not found"}};
        }
        return http:NO_CONTENT;
    }

    # The caller's todos
    #
    # + return - returns can be any of following types
    # http:Ok (A page of the caller's todos)
    # http:Unauthorized (Missing or invalid token)
    resource function get me/todos(http:RequestContext ctx, int 'limit = 20, int offset = 0)
            returns TodoPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int effectiveLimit = 'limit;
        if effectiveLimit < 1 || effectiveLimit > 100 {
            effectiveLimit = 20;
        }
        int effectiveOffset = offset < 0 ? 0 : offset;

        int total = check countTodosByUser(caller.userId);
        TodoRow[] rows = check listTodosByUser(caller.userId, effectiveLimit, effectiveOffset);
        Todo[] data = from TodoRow row in rows
            select toTodo(row);

        string? next = (effectiveOffset + effectiveLimit) < total
            ? string `/me/todos?limit=${effectiveLimit}&offset=${effectiveOffset + effectiveLimit}`
            : ();
        string? previous = effectiveOffset > 0
            ? string `/me/todos?limit=${effectiveLimit}&offset=${previousOffset(effectiveOffset, effectiveLimit)}`
            : ();
        return {count: total, next, previous, data};
    }

    # Edit the caller's todo (title and/or completion)
    #
    # + return - returns can be any of following types
    # http:Ok (The updated todo)
    # http:BadRequest (Invalid update)
    # http:NotFound (No such todo for the caller)
    # http:Unauthorized (Missing or invalid token)
    resource function patch me/todos/[string todoId](http:RequestContext ctx, @http:Payload TodoUpdate payload)
            returns Todo|ErrorBadRequest|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }

        string? newTitle = payload?.title;
        if newTitle is string && newTitle.trim() == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "invalid title", description: "title must not be empty"}};
        }

        TodoRow|error current = fetchTodoRow(todoId, caller.userId);
        if current is sql:NoRowsError {
            return <ErrorNotFound>{body: {code: 404, message: "todo not found"}};
        }
        if current is error {
            return current;
        }

        string mergedTitle = newTitle is string ? newTitle.trim() : current.title;
        boolean? completedUpdate = payload?.completed;
        boolean mergedCompleted = completedUpdate is boolean ? completedUpdate : current.completed;

        boolean changed = mergedTitle != current.title || mergedCompleted != current.completed;
        if !changed {
            return toTodo(current);
        }

        time:Utc now = time:utcNow();
        int affected = check updateTodoRow(todoId, caller.userId, mergedTitle, mergedCompleted, now);
        if affected == 0 {
            return <ErrorNotFound>{body: {code: 404, message: "todo not found"}};
        }
        TodoRow updated = {
            id: current.id,
            userId: current.userId,
            title: mergedTitle,
            completed: mergedCompleted,
            createdAt: current.createdAt,
            updatedAt: now
        };
        return toTodo(updated);
    }

    # Add a todo for the caller
    #
    # + return - returns can be any of following types
    # http:Created (The created todo)
    # http:BadRequest (Invalid todo title)
    # http:Unauthorized (Missing or invalid token)
    resource function post me/todos(http:RequestContext ctx, @http:Payload TodoCreate payload)
            returns Todo|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }

        string title = payload.title.trim();
        if title == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "invalid title", description: "title must not be empty"}};
        }

        string id = uuid:createRandomUuid();
        time:Utc now = time:utcNow();
        check insertTodo(id, caller.userId, title, now);
        string nowText = time:utcToString(now);
        return {id, title, completed: false, createdAt: nowText, updatedAt: nowText};
    }
}

function previousOffset(int offset, int 'limit) returns int {
    int p = offset - 'limit;
    return p < 0 ? 0 : p;
}

function toTodo(TodoRow row) returns Todo => {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: time:utcToString(row.createdAt),
    updatedAt: time:utcToString(row.updatedAt)
};

public type Todo record {|
    string id;
    string title;
    boolean completed;
    string createdAt;
    string updatedAt;
|};

public type ErrorNotFound record {|
    *http:NotFound;
    Error body;
|};

public type TodoPage record {|
    # total matching items
    int count;
    # relative URI of the next page
    string? next = ();
    # relative URI of the previous page
    string? previous = ();
    Todo[] data;
|};

public type Error record {|
    # HTTP or application error code
    int code;
    # short human-readable label
    string message;
    # detailed explanation
    string description?;
    # URI to documentation
    string moreInfo?;
|};

public type ErrorBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type TodoCreate record {|
    string title;
|};

public type TodoUpdate record {|
    string title?;
    boolean completed?;
|};
