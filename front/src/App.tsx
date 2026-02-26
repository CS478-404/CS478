import { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
} from "@mui/material";
import AppLayout from "./AppLayout.tsx";

axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = true;
axios.defaults.validateStatus = () => true;

type ApiError = { error?: string; errors?: string[] };
type LoginResponse = { username?: string } & ApiError;
type Meal = {
  strTags: string;
  strCategory: string;
  strMealThumb: string;
  strMeal: string;
};
type Ingredient = {
  name: string
};

function blurActiveElement() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function AuthOnly() {
  let [cookies, setCookie, removeCookie] = useCookies(["token", "username"]);
  let isLoggedIn = cookies.username !== undefined;
  let [authOpen, setAuthOpen] = useState(false);
  let [authMode, setAuthMode] = useState<"login" | "register">("login");
  let [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    identifier: "",
  });
  let [loginMessage, setLoginMessage] = useState("");
  let [noticeOpen, setNoticeOpen] = useState(false);
  let [noticeText, setNoticeText] = useState("");
  let [noticeSeverity, setNoticeSeverity] = useState<
    "success" | "info" | "warning" | "error"
  >("error");

  let [meals, setMeals] = useState<Meal[]>([]);
  let [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    async function fetchMeals() {
      try {
        const res = await axios.get("/api/meals");
        setMeals(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchMeals();
  }, []);

  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await axios.get("/api/ingredients");
        setIngredients(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchIngredients();
  }, []);

  function closeNotice() {
    blurActiveElement();
    setNoticeOpen(false);
  }

  function showNotice(
    text: string,
    severity: "success" | "info" | "warning" | "error" = "error",
  ) {
    blurActiveElement();
    setNoticeText(text);
    setNoticeSeverity(severity);
    setNoticeOpen(true);
  }

  function apiErrorText(data?: ApiError, fallback = "Request failed") {
    return data?.error ?? data?.errors?.join("; ") ?? fallback;
  }

  function openAuth(mode: "login" | "register") {
    blurActiveElement();
    setAuthMode(mode);
    setLoginMessage("");
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
    setLoginMessage("");
    setFormData({ username: "", password: "", email: "", identifier: "" });
  }

  let handleFormChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setLoginMessage("");
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  async function submitAuth() {
    setLoginMessage("");

    let url = authMode === "login" ? "/api/login" : "/api/register";
    let expectedStatus = authMode === "login" ? 200 : 201;
    let payload =
      authMode === "login"
        ? { identifier: formData.identifier, password: formData.password }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          };
    let res = await axios.post<LoginResponse>(url, payload);

    if (res.status !== expectedStatus) {
      setLoginMessage(apiErrorText(res.data, "Request failed"));
      return;
    }

    if (authMode === "login") {
      let nextUsername = res.data?.username ?? formData.identifier;
      if (nextUsername) setCookie("username", nextUsername, { path: "/" });
    } else {
      
      if (formData.username) setCookie("username", formData.username, { path: "/" });
    }

    closeAuth();
    showNotice(authMode === "login" ? "Logged in." : "Account created.", "success");
  }

  async function logout() {
    await axios.post("/api/logout");
    removeCookie("token", { path: "/" });
    removeCookie("username", { path: "/" });
    showNotice("Logged out.", "info");
  }

  return (
    <>
      <Snackbar
        open={noticeOpen}
        autoHideDuration={4500}
        onClose={closeNotice}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeNotice}
          severity={noticeSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {noticeText}
        </Alert>
      </Snackbar>

      <AppLayout
        isLoggedIn={isLoggedIn}
        username={cookies.username}
        meals={meals}
        ingredients={ingredients}
        onLoginClick={() => openAuth("login")}
        onRegisterClick={() => openAuth("register")}
        onLogout={logout}
      />

      <Dialog open={authOpen} onClose={closeAuth} disableRestoreFocus>
        <DialogTitle>{authMode === "login" ? "Log in" : "Create account"}</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {authMode === "login"
              ? "Enter your username or email and password to log in."
              : "Choose a username, email, and password to create an account."}
          </DialogContentText>

          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            {authMode === "login" ? (
              <TextField
                label="Username or Email"
                name="identifier"
                value={formData.identifier}
                onChange={handleFormChange}
                autoFocus
                size="small"
              />
            ) : (
              <>
                <TextField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  autoFocus
                  size="small"
                />
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  size="small"
                />
              </>
            )}

            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              size="small"
            />

            {loginMessage && <Alert severity="error">{loginMessage}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeAuth}>Cancel</Button>
          <Button
            variant="contained"
            onClick={(event) => {
              (event.currentTarget as HTMLElement).blur();
              submitAuth();
            }}
          >
            {authMode === "login" ? "Log in" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AuthOnly;
