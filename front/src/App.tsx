import { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import {
  Alert,
  Button,
  Box,
  Divider,
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
type MeResponse = { username: string; email: string } & ApiError;
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
  let [settingsOpen, setSettingsOpen] = useState(false);
  let [meLoading, setMeLoading] = useState(false);
  let [me, setMe] = useState<{ username: string; email: string } | null>(null);
  let [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  let [pwSaving, setPwSaving] = useState(false);

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

  async function fetchMe() {
    if (!isLoggedIn) {
      setMe(null);
      return;
    }

    setMeLoading(true);
    try {
      const res = await axios.get<MeResponse>("/api/me");

      if (res.status === 200 && res.data?.username && res.data?.email) {
        setMe({ username: res.data.username, email: res.data.email });
      } else {
        setMe(null);
      }
    } finally {
      setMeLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

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
    await fetchMe();
    showNotice(authMode === "login" ? "Logged in." : "Account created.", "success");
  }

  async function logout() {
    await axios.post("/api/logout");
    removeCookie("token", { path: "/" });
    removeCookie("username", { path: "/" });
    setMe(null);
    setSettingsOpen(false);
    showNotice("Logged out.", "info");
  }

  async function savePasswordChange() {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      showNotice("Please fill out all password fields.", "warning");
      return;
    }

    if (pwForm.newPassword !== pwForm.confirm) {
      showNotice("New password and confirmation do not match.", "warning");
      return;
    }

    setPwSaving(true);
    try {
      const res = await axios.post<ApiError>("/api/me/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });

      if (res.status !== 200) {
        showNotice(apiErrorText(res.data, "Password update failed"), "error");
        return;
      }

      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      showNotice("Password updated.", "success");
    } finally {
      setPwSaving(false);
    }
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
        onOpenUserSettings={() => setSettingsOpen(true)}
        meals={meals}
        ingredients={ingredients}
        onLoginClick={() => openAuth("login")}
        onRegisterClick={() => openAuth("register")}
        onLogout={logout}
      />

      <Dialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
        }}
        disableRestoreFocus
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>User Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Username"
              value={me?.username ?? cookies.username ?? ""}
              size="small"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Email"
              value={me?.email ?? (meLoading ? "Loading..." : "")}
              size="small"
              InputProps={{ readOnly: true }}
            />

            <Divider />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ fontWeight: 600 }}>Change Password</Box>
              <TextField
                label="Current password"
                type="password"
                size="small"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
              <TextField
                label="New password"
                type="password"
                size="small"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
              <TextField
                label="Confirm new password"
                type="password"
                size="small"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSettingsOpen(false);
              setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={savePasswordChange}
            disabled={pwSaving || meLoading}
          >
            Save Password
          </Button>
        </DialogActions>
      </Dialog>

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
