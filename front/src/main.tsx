import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CookiesProvider } from "react-cookie"
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'
import App from './App.tsx'
import Recipe from './Recipe.tsx';
import CreateRecipe from './CreateRecipe.tsx';
import Favorites from './Favorites.tsx';

let router = createBrowserRouter([
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
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookiesProvider>
      <RouterProvider router={router} />
    </CookiesProvider>
  </StrictMode>,
)
