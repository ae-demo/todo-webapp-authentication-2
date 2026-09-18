// wireframes.dsl TodoList: navbar, heading "My Todos", a composer row (input +
// primary "Add" button), a table "Title | Status | " whose rows navigate to
// TodoEdit, and helper text. The third, unlabelled table column carries a
// chevron affordance for "click to open"; the Status column is itself a Chip
// a caller can click to toggle complete/reopen in place — the acceptance
// criterion "toggling status in the list ... marks complete/reopens" reads
// from that cell, with the row's own click still opening TodoEdit.

import { useCallback, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  ListingTable,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { ChevronRight, Plus } from "@wso2/oxygen-ui-icons-react";
import { fetchAllMyTodos, todoApi } from "../api";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];

export function TodoListPage(): JSX.Element {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const all = await fetchAllMyTodos();
    if (all === null) {
      setError("Could not load your todos. Try reloading the page.");
      return;
    }
    setTodos(all);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(): Promise<void> {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const { data, error: apiError } = await todoApi.POST("/me/todos", {
        body: { title },
      });
      if (!apiError && data) {
        setTodos((prev) => [...(prev ?? []), data]);
        setNewTitle("");
      } else {
        setError("Could not add that todo.");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(todo: Todo): Promise<void> {
    const { data, error: apiError } = await todoApi.PATCH("/me/todos/{todoId}", {
      params: { path: { todoId: todo.id } },
      body: { completed: !todo.completed },
    });
    if (!apiError && data) {
      setTodos((prev) => (prev ?? []).map((t) => (t.id === todo.id ? data : t)));
    }
  }

  function openTodo(todo: Todo): void {
    navigate(`/todos/${todo.id}`, { state: { todo } });
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>My Todos</PageTitle.Header>
      </PageTitle>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="What needs doing?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAdd();
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          disabled={adding || newTitle.trim().length === 0}
          onClick={() => void handleAdd()}
        >
          Add
        </Button>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {todos === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Title</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell />
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {todos.map((todo) => (
                <ListingTable.Row key={todo.id} clickable onClick={() => openTodo(todo)}>
                  <ListingTable.Cell>{todo.title}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip
                      label={todo.completed ? "Done" : "Open"}
                      color={todo.completed ? "success" : "default"}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggle(todo);
                      }}
                    />
                  </ListingTable.Cell>
                  <ListingTable.Cell align="right">
                    <ChevronRight size={18} />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {todos.length === 0 && (
            <ListingTable.EmptyState
              title="No todos yet"
              description="Add your first todo above."
            />
          )}
        </ListingTable.Container>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Click a todo to edit or delete it.
      </Typography>
    </PageContent>
  );
}
