import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CookiesProvider } from "react-cookie";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "./index.css";
import App from "./App.tsx";
import Recipe from "./Recipe.tsx";
import CreateRecipe from "./CreateRecipe.tsx";
import MyRecipe from "./MyRecipe.tsx";
import Favorites from "./Favorites.tsx";
import theme from "./theme.ts";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
      },
      {
        path: "recipe/:id",
        element: <Recipe />,
      },
      {
        path: "create",
        element: <CreateRecipe />,
      },
      {
        path: "favorites",
        element: <Favorites />,
      },
      {
        path: "myrecipes",
        element: <MyRecipe />,
      }
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CookiesProvider>
        <RouterProvider router={router} />
      </CookiesProvider>
    </ThemeProvider>
  </StrictMode>,
);
