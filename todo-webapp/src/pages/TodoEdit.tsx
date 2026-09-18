// wireframes.dsl TodoEdit: navbar, heading "Edit Todo", input "Title",
// checkbox "Completed", a row with "Save" (primary, -> TodoList) and "Delete"
// (danger, -> TodoList). No GET /me/todos/{id} exists in todo-api's contract
// (loads: null — see src/authz/screens.ts), so the row clicked in TodoList
// hands its Todo down via router state; a direct/refreshed visit falls back to
// one GET /me/todos call and finds the matching row.

import { useEffect, useState, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Form,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];

export function TodoEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateTodo = (location.state as { todo?: Todo } | null)?.todo;

  const [todo, setTodo] = useState<Todo | null>(stateTodo ?? null);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState(stateTodo?.title ?? "");
  const [completed, setCompleted] = useState(stateTodo?.completed ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (todo || !id) return;
    let live = true;
    void todoApi.GET("/me/todos", {}).then(({ data, error: apiError }) => {
      if (!live) return;
      if (apiError) {
        setError("Could not load this todo.");
        return;
      }
      const found = data?.data.find((t) => t.id === id);
      if (!found) {
        setNotFound(true);
        return;
      }
      setTodo(found);
      setTitle(found.title);
      setCompleted(found.completed);
    });
    return () => {
      live = false;
    };
  }, [id, todo]);

  async function handleSave(): Promise<void> {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const { error: apiError } = await todoApi.PATCH("/me/todos/{todoId}", {
        params: { path: { todoId: id } },
        body: { title, completed },
      });
      if (apiError) {
        setError("Could not save your changes.");
        return;
      }
      navigate("/todos");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      const { error: apiError } = await todoApi.DELETE("/me/todos/{todoId}", {
        params: { path: { todoId: id } },
      });
      if (apiError) {
        setError("Could not delete this todo.");
        return;
      }
      navigate("/todos");
    } finally {
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.BackButton onClick={() => navigate("/todos")}>Back</PageTitle.BackButton>
          <PageTitle.Header>Edit Todo</PageTitle.Header>
        </PageTitle>
        <Typography>This todo no longer exists.</Typography>
      </PageContent>
    );
  }

  if (!todo) {
    return (
      <PageContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/todos")}>Back</PageTitle.BackButton>
        <PageTitle.Header>Edit Todo</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <Form.Stack>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
            }
            label="Completed"
          />
        </Form.Stack>
      </Form.Section>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="error"
          disabled={deleting || saving}
          onClick={() => void handleDelete()}
        >
          Delete
        </Button>
        <Button
          variant="contained"
          disabled={saving || deleting || title.trim().length === 0}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
      </Stack>
    </PageContent>
  );
}
