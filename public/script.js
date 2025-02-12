(() => {
  let darkMode = false;
  let user = null;
  let todos = [];

  const setUser = (value) => {
    user = value;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      const userNameElement = document.querySelector("#user-name");
      if (userNameElement) userNameElement.textContent = user.name;
    } else {
      localStorage.removeItem("user");
    }
  };

  let elements = {
    themeBtn: document.querySelector(".theme-btn"),
    loginForm: document.querySelector("#login-form"),
    registerForm: document.querySelector("#register-form"),
  };

  class ApiService {
    static API_BASE_URL = "/api/v1";
    static isRefreshing = false;
    static refreshQueue = [];

    static async apiRequest(endpoint, method, bodyData = null, retry = true) {
      if (!endpoint || !method) {
        throw new Error("Endpoint and method are required");
      }

      const options = {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...(bodyData && { body: JSON.stringify(bodyData) }),
      };

      try {
        const response = await fetch(
          `${this.API_BASE_URL}${endpoint}`,
          options
        );
        const data = await response.json();

        if (response.status === 401 && retry) {
          console.warn("Access token expired, attempting refresh...");
          return this.handleTokenRefresh(endpoint, method, bodyData);
        }

        return data;
      } catch (error) {
        renderMessagePopup(error.message);
        console.error(`Error during API request to ${endpoint}:`, error);
        throw error;
      }
    }

    static async handleTokenRefresh(endpoint, method, bodyData) {
      if (this.isRefreshing) {
        return new Promise((resolve) => {
          this.refreshQueue.push(() =>
            resolve(this.apiRequest(endpoint, method, bodyData, false))
          );
        });
      }

      this.isRefreshing = true;

      try {
        const refreshResponse = await this.refreshAccessToken();
        if (refreshResponse.success) {
          console.log("Token refreshed, retrying request...");
          return this.apiRequest(endpoint, method, bodyData, false);
        } else {
          console.error(
            "Failed to refresh access token, redirecting to login."
          );
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Refresh token invalid or expired, logging out.");
        window.location.href = "/login";
      } finally {
        this.isRefreshing = false;
        this.refreshQueue.forEach((callback) => callback());
        this.refreshQueue = [];
      }
    }

    static registerUser(name, email, password) {
      return this.apiRequest("/users/register", "POST", {
        name,
        email,
        password,
      });
    }

    static loginUser(email, password) {
      return this.apiRequest("/users/login", "POST", { email, password });
    }

    static refreshAccessToken() {
      return this.apiRequest(
        "/users/refresh-access-token",
        "PATCH",
        null,
        false
      );
    }

    static logoutUser() {
      return this.apiRequest("/users/logout", "POST");
    }

    static deleteUser(password) {
      return this.apiRequest("/users/delete", "DELETE", { password });
    }

    static fetchTodos() {
      return this.apiRequest("/todos", "GET");
    }

    static addTodo(title, description, dueTime) {
      return this.apiRequest("/todos/add", "POST", {
        title,
        description,
        dueTime,
      });
    }

    static updateTodo(id, title, description, dueTime) {
      return this.apiRequest(`/todos/update/${id}`, "PUT", {
        title,
        description,
        dueTime,
      });
    }

    static toggleTodoStatus(id, status) {
      return this.apiRequest(`/todos/status/${id}`, "PATCH", { status });
    }

    static deleteTodo(id) {
      return this.apiRequest(`/todos/delete/${id}`, "DELETE");
    }
  }

  class Validation {
    static isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    static isPasswordValid = (password) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,100}$/.test(password);

    static isNameValid = (name) => /^.{3,50}$/.test(name);

    static isTitleValid = (title) => /^.{1,100}$/.test(title);

    static isDescriptionValid = (description) => /^.{0,200}$/.test(description);

    static isDueTimeValid = (dueTime) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dueTime);
  }

  const getTimeLeft = (dueDateTime) => {
    const now = Date.now();
    const dueDate = new Date(dueDateTime).getTime();
    let diff = dueDate - now;

    const isLate = diff < 0;
    diff = Math.abs(diff);

    const timeUnits = [
      { label: "yr", value: 1000 * 60 * 60 * 24 * 365 },
      { label: "mo", value: 1000 * 60 * 60 * 24 * 30 },
      { label: "d", value: 1000 * 60 * 60 * 24 },
      { label: "hr", value: 1000 * 60 * 60 },
      { label: "min", value: 1000 * 60 },
    ];

    const timeParts = timeUnits.reduce((acc, unit) => {
      const amount = Math.floor(diff / unit.value);
      diff -= amount * unit.value;
      if (amount > 0)
        acc.push(`${amount} ${unit.label}${amount > 1 ? "s" : ""}`);
      return acc;
    }, []);

    return isLate
      ? `Time's up, ${timeParts.join(" ")} late`
      : `${timeParts.join(" ")} left`;
  };

  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Render Functions

  const renderMessagePopup = (message) => {
    const popup = document.createElement("div");
    popup.className = "notification small-popup";

    popup.innerHTML = `
    <p class="text-gray-100">${message}</p>
    <button class="close min-w-fit relative flex items-center justify-center fill-orange ml-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="size-3 absolute"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="size-5 stroke-orange absolute">
        <rect x="64" y="64" width="384" height="384" rx="96" ry="96" fill="none" stroke-width="32" stroke-dasharray="1536" stroke-dashoffset="1536">
          <animate attributeName="stroke-dashoffset" from="1536" to="0" dur="4s" fill="freeze" />
        </rect>
      </svg>
    </button>
  `;

    const removePopup = () => {
      popup.remove();
      clearTimeout(popup.timeoutId);
    };

    const existingPopup = document.querySelector(".small-popup");
    if (existingPopup) {
      existingPopup.removeEventListener("click", removePopup);
      clearTimeout(existingPopup.timeoutId);
      existingPopup.remove();
    }

    document.body.appendChild(popup);
    popup
      .querySelector(".close")
      .addEventListener("click", removePopup, { once: true });
    popup.timeoutId = setTimeout(removePopup, 4000);
  };

  const renderUserConfirmation = (message, callback = () => {}) => {
    const popup = document.createElement("div");
    popup.className = "confirmation small-popup";

    popup.innerHTML = `
    <p class="secondary-heading">${message}</p>
    <div class="w-fit flex gap-2">
      <button class="cancel p-[9px] icon" aria-label="Cancel">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
      </button>
      <button class="confirm icon" aria-label="Confirm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
      </button>
    </div>
  `;

    const removePopup = () => {
      clearTimeout(popup.timeoutId);
      popup.remove();
    };

    const handleEvent = (e) => {
      const target = e.target.closest(".confirm, .cancel");
      if (!target) return;

      if (target.classList.contains("confirm")) {
        target.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="animate-spin"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>
      `;
        target.disabled = true;

        callback();
        target.disabled = false;
        removePopup();
      } else {
        removePopup();
      }
    };

    const existingPopup = document.querySelector(".confirmation");
    if (existingPopup) {
      existingPopup.removeEventListener("click", handleEvent);
      clearTimeout(existingPopup.timeoutId);
      existingPopup.remove();
    }

    document.body.appendChild(popup);
    popup.addEventListener("click", handleEvent);
    popup.timeoutId = setTimeout(removePopup, 60000);
  };

  const renderTodos = (todos) => {
    const todosContainer = document.querySelector("#todos");
    todosContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    todos.forEach((todo) => {
      const todoDiv = document.createElement("div");
      todoDiv.id = `todo-${todo._id}`;
      const parsedDueTime = getTimeLeft(todo.dueTime);
      todoDiv.className = `todo ${
        parsedDueTime.startsWith("Time's up")
          ? "border-orange"
          : "border-gray-500"
      }`;

      todoDiv.innerHTML = `
      <div class="flex flex-col items-start gap-1">
        <h3 class="secondary-heading${todo.status ? " line-through" : ""}">${
        todo.title
      }</h3>
      ${
        todo.description
          ? `<p${todo.status ? " class='line-through'" : ""}>${
              todo.description.length > 50
                ? `${todo.description.slice(
                    0,
                    50
                  )}...<button class="read-more">Read More</button>`
                : todo.description
            }</p>`
          : ""
      }
    </div>
    <div class="min-w-fit flex items-center gap-2">
    ${
      !todo.status
        ? `<p class="due-time${
            parsedDueTime.startsWith("Time's up") ? " text-orange" : ""
          }">
            ${parsedDueTime}
        </p>`
        : ""
    }
    <button class="status icon ${todo.status ? "checked" : "unchecked"}">
      ${
        todo.status
          ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`
          : ""
      }
    </button>
    <button class="edit icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"/></svg>
    </button>
    <button class="delete icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="size-4 fill-gray-900 dark:fill-gray-200"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
    </button>
  </div>
  `;

      fragment.appendChild(todoDiv);
    });

    todosContainer.appendChild(fragment);
  };

  const setTheme = (isDarkMode) => {
    darkMode = isDarkMode;
    localStorage.setItem("darkMode", String(isDarkMode));
    document.documentElement.classList.toggle("dark", isDarkMode);
    elements.themeBtn.innerHTML = isDarkMode
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>`;
  };

  const togglePasswordVisibility = (eye) => {
    const passwordInput = eye.previousElementSibling;
    const isPasswordType = passwordInput.getAttribute("type") === "password";
    passwordInput.setAttribute("type", isPasswordType ? "text" : "password");
    eye.innerHTML = isPasswordType
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>`;
  };

  const handleQueryParamsAndPopups = () => {
    const newUrl = window.location.origin + window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");

    const routeMessageMap = new Map([
      [
        "/login",
        ["login_required", "logged_out", "account_deleted", "login_again"],
      ],
      ["/dashboard", ["login_success", "account_success"]],
    ]);

    const messages = new Map([
      ["login_required", "Please login to access the dashboard!"],
      ["logged_out", "Logged out successfully!"],
      ["account_deleted", "Account deleted successfully!"],
      ["login_again", "Please login again!"],
      ["login_success", "Logged in successfully!"],
      ["account_success", "Account created successfully!"],
    ]);

    const currentRoute = window.location.pathname;
    const allowedMessages = routeMessageMap.get(currentRoute) || [];

    if (allowedMessages.includes(message) && messages.has(message)) {
      const text = messages.get(message);
      renderMessagePopup(text);
    }

    window.history.replaceState(null, "", newUrl);
  };

  const loadSavedConfig = () => {
    const storedDarkMode = localStorage.getItem("darkMode");
    setTheme(
      storedDarkMode
        ? storedDarkMode === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      if (window.location.pathname === "/dashboard") {
        window.location.href = "/login?message=login_required";
      }
    } else {
      setUser(storedUser);
      if (["/login", "/register", "/"].includes(window.location.pathname)) {
        window.location.href = "/dashboard?message=logged_in";
      }
    }
  };

  const fetchTodos = async () => {
    try {
      let getTodosResponse = await ApiService.fetchTodos();

      if (!getTodosResponse.success) {
        if (getTodosResponse.statusCode === 401) {
          const refreshAccessResponse = await ApiService.refreshAccessToken();

          if (!refreshAccessResponse.success) {
            localStorage.removeItem("user");
            window.location.href = "/login?message=login_again";
            return;
          }

          getTodosResponse = await ApiService.fetchTodos();
          if (!getTodosResponse.success)
            throw new Error(getTodosResponse.message);
        } else {
          throw new Error(getTodosResponse.message);
        }
      }
      todos = getTodosResponse.data;

      if (todos.length === 0) {
        const todosContainer = document.querySelector("#todos");
        const noTodosMessage =
          todosContainer.querySelector(".no-todos-message");
        noTodosMessage.textContent =
          "You have no tasks. Feel free to add some!";
      } else {
        renderTodos(todos);
      }
    } catch (error) {
      renderMessagePopup(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (!Validation.isEmailValid(email)) {
      elements.loginForm.email.focus();
      renderMessagePopup("Invalid email");
      return;
    }
    if (!Validation.isPasswordValid(password)) {
      elements.loginForm.password.focus();
      renderMessagePopup(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number"
      );
      return;
    }

    const submitBtn = elements.loginForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    try {
      const response = await ApiService.loginUser(email, password);
      if (!response.success) throw new Error(response.message);
      setUser(response.data.user);
      elements.loginForm.reset();
      window.location.href = "/dashboard?message=login_success";
    } catch (error) {
      renderMessagePopup(error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (!Validation.isNameValid(name)) {
      elements.registerForm.name.focus();
      renderMessagePopup("Name must be at least 3 characters long");
      return;
    }
    if (!Validation.isEmailValid(email)) {
      elements.registerForm.email.focus();
      renderMessagePopup("Invalid email");
      return;
    }
    if (!Validation.isPasswordValid(password)) {
      elements.registerForm.password.focus();
      renderMessagePopup(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number"
      );
      return;
    }

    const registerSubmitBtn = elements.registerForm.querySelector(
      "button[type='submit']"
    );
    registerSubmitBtn.disabled = true;
    registerSubmitBtn.textContent = "Processing...";

    try {
      const registerResponse = await ApiService.registerUser(
        name,
        email,
        password
      );
      if (!registerResponse.success) throw new Error(registerResponse.message);
      const loginResponse = await ApiService.loginUser(email, password);
      if (!loginResponse.success) throw new Error(loginResponse.message);
      setUser(loginResponse.data.user);
      elements.registerForm.reset();
      window.location.href = "/dashboard?message=account_success";
    } catch (error) {
      renderMessagePopup(error.message);
    } finally {
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.textContent = "Register";
    }
  };

  const handleLogout = async () => {
    try {
      const logoutResponse = await ApiService.logoutUser();
      if (!logoutResponse.success) throw new Error(logoutResponse.message);
      setUser(null);
      window.location.href = "/login?message=logged_out";
    } catch (error) {
      renderMessagePopup(error.message);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      const deleteTodoResponse = await ApiService.deleteTodo(todoId);
      if (!deleteTodoResponse.success)
        throw new Error(deleteTodoResponse.message);

      todos = todos.filter((todo) => todo._id !== todoId);
      renderTodos(todos);
    } catch (error) {
      renderMessagePopup(error.message);
    }
  };

  const handleDeleteUser = () => {
    const popupContainer = document.createElement("div");
    popupContainer.className = "popup-container";

    const form = document.createElement("form");
    form.id = "delete-account-form";
    form.classList.add("box");

    form.innerHTML = `
    <h2 class="main-heading">Delete Account</h2>
    <div class="w-full relative flex items-center">
      <input
        name="password"
        type="password"
        placeholder="Confirm your password"
        class="input pr-10"
        required
      />
      <button type="button" class="eye">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
          <path
            d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"
          />
        </svg>
      </button>
    </div>
    <div class="w-full flex gap-4">
      <button type="submit" class="w-full orange-btn-2 submit">Delete</button>
      <button type="button" class="w-full cancel gray-btn-2">Cancel</button>
    </div>
  `;

    const removePopup = () => {
      form.removeEventListener("submit", handleSubmit);
      popupContainer.removeEventListener("click", handlePopupClose);
      clearTimeout(popupContainer.timeoutId);
      popupContainer.remove();
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const password = form.password.value;

      if (!Validation.isPasswordValid(password)) {
        form.password.focus();
        renderMessagePopup(
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number."
        );
        return;
      }

      const submitBtn = form.querySelector(".submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";
      try {
        const deleteUserResponse = await ApiService.deleteUser(password);
        if (!deleteUserResponse.success) {
          throw new Error(deleteUserResponse.message);
        }
        setUser(null);
        form.reset();
        window.location.href = "/login?message=account_deleted";
      } catch (error) {
        renderMessagePopup(error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Delete";
      }
    };

    const handlePopupClose = (e) => {
      if (e.target.closest(".cancel") || !e.target.closest(".box")) {
        removePopup();
      } else if (e.target.closest(".eye")) {
        const eye = e.target.closest(".eye");
        togglePasswordVisibility(eye);
      }
    };

    const existingPopup = document.querySelector(".popup-container");
    if (existingPopup) {
      existingPopup
        .querySelector("form")
        .removeEventListener("submit", handleSubmit);
      existingPopup.removeEventListener("click", handlePopupClose);
      clearTimeout(existingPopup.timeoutId);
      existingPopup.remove();
    }

    document.body.appendChild(popupContainer);
    popupContainer.appendChild(form);
    form.addEventListener("submit", handleSubmit);
    popupContainer.addEventListener("click", handlePopupClose);
    popupContainer.timeoutId = setTimeout(removePopup, 60000);
  };

  const handleAddEditTodo = (todo) => {
    const popupContainer = document.createElement("div");
    popupContainer.classList.add("popup-container");

    const form = document.createElement("form");
    form.classList.add("box");

    form.innerHTML = `
    <h2 class="main-heading">${todo ? "Edit Task" : "Add New Task"}</h2>
    <div class="w-full relative flex flex-col gap-1 items-start">
      <label for="title" class="label">Title <span class="text-orange">*</span></label>
      <input id="title" name="title" type="text" placeholder="Enter task title" class="input" value="${
        todo?.title || ""
      }" required />
    </div>
    <div class="w-full relative flex flex-col gap-1 items-start">
      <label for="description" class="label">Description</label>
      <textarea id="description" name="description" placeholder="Enter task description" class="input h-full min-h-20" rows="2" maxlength="1000">${
        todo?.description || ""
      }</textarea>
    </div>
    <div class="w-full relative flex flex-col gap-1 items-start">
      <label for="dueDate" class="label">Due Date and Time <span class="text-orange">*</span></label>
      <input id="dueDate" name="dueDate" type="datetime-local" class="input uppercase" value="${
        todo?.dueTime || ""
      }" required />
    </div>
    <div class="w-full flex gap-4">
      <button type="submit" class="w-full orange-btn-2 submit-btn">${
        todo ? "Update" : "Add"
      }</button>
      <button type="button" class="w-full cancel-btn gray-btn-2">Cancel</button>
    </div>
  `;

    const removePopup = () => {
      form.removeEventListener("submit", handleFormSubmit);
      popupContainer.removeEventListener("click", handlePopupClose);
      clearTimeout(popupContainer.timeoutId);
      popupContainer.remove();
    };

    const handlePopupClose = (e) => {
      if (e.target.closest(".cancel-btn") || !e.target.closest(".box"))
        removePopup();
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      const title = form.title.value;
      const description = form.description.value;
      const dueTime = form.dueDate.value;

      if (!Validation.isTitleValid(title)) {
        form.title.focus();
        renderMessagePopup("Title must be less than 100 characters.");
        return;
      }

      if (!Validation.isDescriptionValid(description)) {
        form.description.focus();
        renderMessagePopup("Description must be less than 200 characters.");
        return;
      }

      if (!Validation.isDueTimeValid(dueTime)) {
        form.dueDate.focus();
        renderMessagePopup(
          "Invalid due date and time format (YYYY-MM-DDTHH:MM)."
        );
        return;
      }

      const submitBtn = form.querySelector(".submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";

      try {
        const response = await (todo
          ? ApiService.updateTodo(todo._id, title, description, dueTime)
          : ApiService.addTodo(title, description, dueTime));

        if (!response.success) throw new Error(response.message);

        todo
          ? (todos = todos.map((t) => (t._id === todo._id ? response.data : t)))
          : todos.push(response.data);

        renderTodos(todos);
        removePopup();
      } catch (error) {
        renderMessagePopup(error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = todo ? "Update" : "Add";
      }
    };

    const existingPopup = document.querySelector(".popup-container");
    if (existingPopup) {
      existingPopup
        .querySelector("form")
        .removeEventListener("submit", handleFormSubmit);
      existingPopup.removeEventListener("click", handlePopupClose);
      clearTimeout(existingPopup.timeoutId);
      existingPopup.remove();
    }

    document.body.appendChild(popupContainer);
    popupContainer.appendChild(form);
    form.addEventListener("submit", handleFormSubmit);
    popupContainer.addEventListener("click", handlePopupClose);
    popupContainer.timeoutId = setTimeout(removePopup, 60000);
  };

  const handleToggleTodoStatus = async (todoId, status) => {
    if (typeof status !== "boolean") {
      renderMessagePopup("Invalid status parameter");
      return;
    }

    try {
      const response = await ApiService.toggleTodoStatus(todoId, status);
      if (!response.success) throw new Error(response.message);

      const updatedTodo = response.data;
      todos = todos.map((todo) => (todo._id === todoId ? updatedTodo : todo));
      renderTodos(todos);
    } catch (error) {
      renderMessagePopup(error.message);
    }
  };

  const setupTodoEventListeners = () => {
    const todosContainer = document.querySelector("#todos");

    const handleTodoClick = async (e) => {
      const target = e.target.closest(".todo");
      if (!target) return;

      const todoId = target.id.split("-")[1];
      const todo = todos.find((todo) => todo._id === todoId);
      if (e.target.closest(".status")) {
        const targetBtn = e.target.closest(".status");
        targetBtn.disabled = true;
        const toggleStatus = async () => {
          if (todo.status) {
            await handleToggleTodoStatus(todoId, false);
            targetBtn.innerHTML = "";
          } else {
            await handleToggleTodoStatus(todoId, true);
            targetBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
          }
          targetBtn.disabled = false;
        };
        debounce(toggleStatus, 500)();
      } else if (e.target.closest(".edit")) {
        handleAddEditTodo(todo);
      } else if (e.target.closest(".delete")) {
        renderUserConfirmation("Do you want to delete this todo?", () =>
          handleDeleteTodo(todoId)
        );
      }
    };

    todosContainer.removeEventListener("click", handleTodoClick);
    todosContainer.addEventListener("click", handleTodoClick);
  };

  window.addEventListener("DOMContentLoaded", () => {
    handleQueryParamsAndPopups();
    loadSavedConfig();

    elements.themeBtn?.addEventListener("click", () => setTheme(!darkMode));

    if (user) {
      fetchTodos();
      setupTodoEventListeners();

      const handleBodyClick = (e) => {
        if (!e.target.closest(".logout, .delete-account, .add-todo")) return;

        if (e.target.closest(".logout")) {
          renderUserConfirmation("Do you want to logout?", () => {
            handleLogout();
          });
        } else if (e.target.closest(".delete-account")) {
          handleDeleteUser();
        } else if (e.target.closest(".add-todo")) {
          handleAddEditTodo();
        }
      };

      document.body.removeEventListener("click", handleBodyClick);
      document.body.addEventListener("click", handleBodyClick);
    } else {
      const eye = document.querySelector(".eye");
      eye?.addEventListener("click", () => {
        togglePasswordVisibility(eye);
      });
      elements.loginForm &&
        elements.loginForm?.addEventListener("submit", handleLogin);
      elements.registerForm &&
        elements.registerForm?.addEventListener("submit", handleRegister);
    }
  });
})();
