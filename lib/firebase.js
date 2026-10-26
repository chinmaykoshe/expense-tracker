export function encodeFirebaseKey(k) {
  return String(k).replace(/[.$[\]#/]/g, (c) => ({
    ".": "%2E",
    $: "%24",
    "[": "%5B",
    "]": "%5D",
    "#": "%23",
    "/": "%2F",
  }[c]));
}

export function decodeFirebaseKey(k) {
  return String(k).replace(/%2[EFef]|%24|%5[BbDd]|%23/g, (match) => {
    switch (match.toUpperCase()) {
      case "%2E":
        return ".";
      case "%24":
        return "$";
      case "%5B":
        return "[";
      case "%5D":
        return "]";
      case "%23":
        return "#";
      case "%2F":
        return "/";
      default:
        return match;
    }
  });
}

export const MAX_ALLOWED_USERS = 100;

export function getFirebaseConfig(username) {
  const envUrl = (
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    process.env.VITE_FIREBASE_DATABASE_URL ||
    ""
  ).trim();

  const envNode = (
    process.env.NEXT_PUBLIC_FIREBASE_NODE ||
    process.env.VITE_FIREBASE_NODE ||
    "expenseTracker"
  ).trim();

  const envSecret = (
    process.env.NEXT_PUBLIC_DATABASE_SECRET ||
    process.env.VITE_DATABASE_SECRET ||
    ""
  ).trim();

  const baseUrl = envUrl.trim().replace(/\/+$/, "");
  const baseNode = envNode.trim().replace(/^\/+|\/+$/g, "");

  // Segregate data per user:
  // "admin" or legacy single-user stays on baseNode for backwards compatibility
  // Other users get isolated branches to prevent collisions & data bloat (expenseTracker_username)
  let userNode = baseNode;
  const cleanUsername = String(username || "").trim().toLowerCase();
  if (cleanUsername && cleanUsername !== "admin") {
    userNode = `${baseNode}_${encodeFirebaseKey(cleanUsername)}`;
  }

  const secret = envSecret.trim();
  const authParam = secret ? `?auth=${encodeURIComponent(secret)}` : "";

  return {
    baseUrl,
    node: userNode,
    baseNode,
    secret,
    dataUrl: baseUrl ? `${baseUrl}/${userNode}.json${authParam}` : "",
    sseUrl: baseUrl ? `${baseUrl}/${userNode}.json${authParam}` : "",
    usersUrl: baseUrl ? `${baseUrl}/expense_users.json${authParam}` : "",
    userUrl: (u) =>
      baseUrl
        ? `${baseUrl}/expense_users/${encodeFirebaseKey(
            String(u).trim().toLowerCase()
          )}.json${authParam}`
        : "",
  };
}

export async function getUserCapacity() {
  const config = getFirebaseConfig();
  if (!config.baseUrl) {
    return { count: 1, limit: MAX_ALLOWED_USERS, available: MAX_ALLOWED_USERS - 1, isFull: false };
  }

  try {
    const res = await fetch(config.usersUrl);
    if (!res.ok) {
      return { count: 1, limit: MAX_ALLOWED_USERS, available: MAX_ALLOWED_USERS - 1, isFull: false };
    }
    const users = await res.json();
    const registeredCount = users ? Object.keys(users).length : 0;
    // Default admin account counts as 1 user
    const totalCount = Math.max(1, registeredCount + 1);
    const isFull = totalCount >= MAX_ALLOWED_USERS;

    return {
      count: totalCount,
      limit: MAX_ALLOWED_USERS,
      available: Math.max(0, MAX_ALLOWED_USERS - totalCount),
      isFull,
    };
  } catch (e) {
    return { count: 1, limit: MAX_ALLOWED_USERS, available: MAX_ALLOWED_USERS - 1, isFull: false };
  }
}

export async function registerUser(username, password) {
  const cleanUser = String(username || "").trim();
  const cleanPass = String(password || "");

  if (cleanUser.length < 3 || cleanUser.length > 30) {
    return { success: false, message: "Username must be between 3 and 30 characters." };
  }
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUser)) {
    return {
      success: false,
      message: "Username can only contain letters, numbers, hyphens, and underscores.",
    };
  }
  if (cleanPass.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }

  const userKey = encodeFirebaseKey(cleanUser.toLowerCase());
  if (cleanUser.toLowerCase() === "admin") {
    return {
      success: false,
      message: "Username 'admin' is reserved. Please sign in or choose another name.",
    };
  }

  const config = getFirebaseConfig();
  if (!config.baseUrl) {
    return { success: false, message: "Database connection not configured. Please check settings." };
  }

  try {
    // 1. Fetch current users to enforce 100-user hard limit
    const res = await fetch(config.usersUrl);
    const existingUsers = res.ok ? (await res.json()) || {} : {};

    const userCount = Object.keys(existingUsers).length + 1; // +1 accounts for admin
    if (userCount >= MAX_ALLOWED_USERS) {
      return {
        success: false,
        message: `Registration limit reached: Maximum capacity of ${MAX_ALLOWED_USERS} users has been reached. Please contact admin.`,
      };
    }

    // 2. Prevent duplicate usernames
    if (existingUsers[userKey]) {
      return {
        success: false,
        message: "Username is already registered. Please choose another username or sign in.",
      };
    }

    // 3. Store new user credentials under /expense_users/<userKey>.json
    const userPayload = {
      username: cleanUser,
      password: cleanPass,
      createdAt: Date.now(),
    };

    const writeRes = await fetch(config.userUrl(cleanUser), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload),
    });

    if (!writeRes.ok) {
      return {
        success: false,
        message: "Failed to save user to database. Please check database permissions.",
      };
    }

    return { success: true, username: cleanUser };
  } catch (err) {
    return { success: false, message: "Network error during registration. Please try again." };
  }
}

export async function pushStateToCloud(state, username) {
  const config = getFirebaseConfig(username);
  if (!config.baseUrl || !config.dataUrl) {
    return { status: "offline", message: "Offline (Local Only)" };
  }

  const safeEntries = {};
  for (const k in state.entries) {
    safeEntries[encodeFirebaseKey(k)] = state.entries[k];
  }

  const safeMomCells = {};
  for (const k in state.momCells) {
    safeMomCells[encodeFirebaseKey(k)] = state.momCells[k];
  }

  const safeRemarks = {};
  for (const k in state.remarks || {}) {
    safeRemarks[encodeFirebaseKey(k)] = state.remarks[k];
  }

  const payload = {
    categories: state.categories,
    entries: safeEntries,
    momCells: safeMomCells,
    remarks: safeRemarks,
    updatedAt: Date.now(),
  };

  const res = await fetch(config.dataUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    return { status: "synced", message: "Cloud Synced" };
  } else if (res.status === 401 || res.status === 403) {
    return { status: "error_perm", message: "Cloud Sync Paused" };
  } else {
    return { status: "offline", message: "Sync Error" };
  }
}

export async function fetchStateFromCloud(username) {
  const config = getFirebaseConfig(username);
  if (!config.baseUrl || !config.dataUrl) {
    return { status: "offline", data: null };
  }

  const res = await fetch(config.dataUrl);
  if (res.ok) {
    const data = await res.json();
    if (data && data.entries) {
      const decodedEntries = {};
      for (const k in data.entries) {
        decodedEntries[decodeFirebaseKey(k)] = data.entries[k];
      }
      const decodedMomCells = {};
      for (const k in data.momCells || {}) {
        decodedMomCells[decodeFirebaseKey(k)] = data.momCells[k];
      }
      const decodedRemarks = {};
      for (const k in data.remarks || {}) {
        decodedRemarks[decodeFirebaseKey(k)] = data.remarks[k];
      }
      return {
        status: "synced",
        data: {
          categories: data.categories || [],
          entries: decodedEntries,
          momCells: decodedMomCells,
          remarks: decodedRemarks,
        },
      };
    } else if (data === null) {
      return { status: "empty", data: null };
    }
  } else if (res.status === 401 || res.status === 403) {
    return { status: "error_perm", data: null };
  }
  return { status: "offline", data: null };
}

export async function authenticateUser(username, password) {
  const cleanUser = String(username || "").trim();
  const cleanPass = String(password || "");
  if (!cleanUser || !cleanPass) {
    return { success: false, message: "Username and password are required." };
  }

  const config = getFirebaseConfig(cleanUser);
  const envUser = process.env.NEXT_PUBLIC_EXPUSER || process.env.EXPUSER || "admin";
  const envPass = process.env.NEXT_PUBLIC_EXPPASS || process.env.EXPPASS || "admin123";

  // Check built-in admin credentials first
  if (
    cleanUser.toLowerCase() === envUser.toLowerCase() &&
    cleanPass === envPass
  ) {
    return { success: true, username: envUser };
  }

  if (!config.baseUrl) {
    return { success: false, message: "Database connection not configured." };
  }

  try {
    // 1. Check registered users in /expense_users/<userKey>.json
    const userRes = await fetch(config.userUrl(cleanUser));
    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData && String(userData.password) === cleanPass) {
        return { success: true, username: userData.username || cleanUser };
      }
    }

    // 2. Check legacy admin nodes in Firebase (expuser / exppass)
    const authParam = config.secret ? `?auth=${encodeURIComponent(config.secret)}` : "";
    const userNode = process.env.NEXT_PUBLIC_EXPUSER_NODE || "expuser";
    const passNode = process.env.NEXT_PUBLIC_EXPPASS_NODE || "exppass";

    const [userResLegacy, passResLegacy] = await Promise.all([
      fetch(`${config.baseUrl}/${userNode}.json${authParam}`),
      fetch(`${config.baseUrl}/${passNode}.json${authParam}`),
    ]);

    const dbUser = userResLegacy.ok ? await userResLegacy.json() : null;
    const dbPass = passResLegacy.ok ? await passResLegacy.json() : null;

    if (dbUser !== null && dbPass !== null) {
      if (
        cleanUser.toLowerCase() === String(dbUser).trim().toLowerCase() &&
        cleanPass === String(dbPass)
      ) {
        return { success: true, username: String(dbUser).trim() };
      }
    }

    return {
      success: false,
      message: "Invalid username or password. Please try again.",
    };
  } catch (err) {
    return {
      success: false,
      message: "Authentication failed. Please check your network connection.",
    };
  }
}

