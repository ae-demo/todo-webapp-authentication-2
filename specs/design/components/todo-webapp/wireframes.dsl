screen TodoList "The signed-in user's todos"
  navbar "Todo" "Sign out"
  heading "My Todos"
  row
    input "What needs doing?"
    right
    button "Add" primary -> TodoList
  table "Title | Status | "
    row "Buy groceries | Open | "
    row "Finish report | Done | "
  text "Click a todo to edit or delete it."

screen TodoEdit "Edit or remove a todo"
  navbar "Todo" "Sign out"
  heading "Edit Todo"
  input "Title"
  checkbox "Completed"
  row
    button "Save" primary -> TodoList
    right
    button "Delete" danger -> TodoList

flow "Manage todos"
  role "User"
  description "A signed-in user reviews, adds, completes, edits, and removes their own todos"
  TodoList
  TodoEdit
