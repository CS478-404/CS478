import {useEffect, useState} from "react";
import axios from "axios";
import {useCookies} from "react-cookie";
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

axios.defaults.baseURL = "http://127.0.0.1:3000";
axios.defaults.withCredentials = true;
axios.defaults.validateStatus = () => true;

type ApiError = { error?: string; errors?: string[] };
type LoginResponse = { username?: string } & ApiError;
type Meal = {
    strTags: string;
    strCategory: string;
    strMealThumb: string;
    strMeal: string;
}

function AuthOnly() {
    let [cookies, , removeCookie] = useCookies(["token", "username"]);
    let isLoggedIn = cookies.username !== undefined;
    let [authOpen, setAuthOpen] = useState(false);
    let [authMode, setAuthMode] = useState<"login" | "register">("login");
    let [formData, setFormData] = useState({username: "", password: "", email: "", identifier: ""});
    let [loginMessage, setLoginMessage] = useState("");
    let [noticeOpen, setNoticeOpen] = useState(false);
    let [noticeText, setNoticeText] = useState("");
    let [noticeSeverity, setNoticeSeverity] = useState<
        "success" | "info" | "warning" | "error"
    >("error");
    let [meals, setMeals] = useState<Meal[]>([]);

    useEffect(() => {
        async function fetchMeals() {
            try {
                const res = await axios.get("/api/meals");
                setMeals(res.data);
            } catch (err) {
                console.log(err);
                console.error(err);
            }
        }

        fetchMeals();
    }, []);

  function showNotice(
      text: string,
      severity: "success" | "info" | "warning" | "error" = "error",
  ) {
    setNoticeText(text);
    setNoticeSeverity(severity);
    setNoticeOpen(true);
  }

  function apiErrorText(data?: ApiError, fallback = "Request failed") {
    return data?.error ?? data?.errors?.join("; ") ?? fallback;
  }

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setLoginMessage("");
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
    setLoginMessage("");
    setFormData({username: "", password: "", email: "", identifier: ""});
  }

  let handleFormChange: React.ChangeEventHandler<HTMLInputElement> = (
      event,
  ) => {
    setLoginMessage("");
    setFormData({...formData, [event.target.name]: event.target.value});
  };

  async function submitAuth() {
    setLoginMessage("");
    let url = authMode === "login" ? "/api/login" : "/api/register";
    let expectedStatus = authMode === "login" ? 200 : 201;
    let payload =
        authMode === "login"
            ? {identifier: formData.identifier, password: formData.password}
            : {username: formData.username, email: formData.email, password: formData.password};
    let res = await axios.post<LoginResponse>(url, payload);

    if (res.status !== expectedStatus) {
      setLoginMessage(apiErrorText(res.data, "Request failed"));
      return;
    }

    closeAuth();
    showNotice(
        authMode === "login" ? "Logged in." : "Account created.",
        "success",
    );
  }

  async function logout() {
    await axios.post("/api/logout");
    removeCookie("token", {path: "/"});
    removeCookie("username", {path: "/"});
    showNotice("Logged out.", "info");
  }

  return (
    <>
      <Snackbar
        open={noticeOpen}
        autoHideDuration={4500}
        onClose={() => setNoticeOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNoticeOpen(false)}
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
                onLoginClick={() => openAuth("login")}
                onRegisterClick={() => openAuth("register")}
                onLogout={logout}>
            </AppLayout>

      <Dialog open={authOpen} onClose={closeAuth}>
        <DialogTitle>
          {authMode === "login" ? "Log in" : "Create account"}
        </DialogTitle>
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
          <Button variant="contained" onClick={submitAuth}>
            {authMode === "login" ? "Log in" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AuthOnly;
