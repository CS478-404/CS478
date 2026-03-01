import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CookiesProvider } from "react-cookie"
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'
import App from './App.tsx'
import Recipe from './Recipe.tsx';
import CreateRecipe from './CreateRecipe.tsx';

let router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/recipe/:id",
    element: <Recipe />
  },
  {
    path: "/create",
    element: <CreateRecipe />
  }
]);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookiesProvider>
      <RouterProvider router={router} />
    </CookiesProvider>
  </StrictMode>,
)
