"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_CATS, STORAGE_KEY } from "../lib/constants";
import {
  pushStateToCloud,
  fetchStateFromCloud,
  getFirebaseConfig,
  decodeFirebaseKey,
} from "../lib/firebase";

function ensureEmptyCustomRow(categories, entries) {
  if (!categories || !categories.length) return [...DEFAULT_CATS];
  const cats = [...categories];
  const lastCat = cats[cats.length - 1];
  const hasEntries = Object.keys(entries || {}).some((k) =>
    k.startsWith(lastCat + "|")
  );
  const isDefaultOther = lastCat.startsWith("Other");

  if (hasEntries || !isDefaultOther) {
    let newName = "Other";
    let counter = 1;
    while (cats.includes(newName)) {
      counter++;
      newName = `Other ${counter}`;
    }
    cats.push(newName);
  }
  return cats;
}

export function useExpenseState(showToast, currentUser) {
  const [state, setState] = useState({
    categories: [...DEFAULT_CATS],
    entries: {},
    momCells: {},
    remarks: {},
  });

  const [cloudStatus, setCloudStatus] = useState("offline");
  const [cloudStatusText, setCloudStatusText] = useState("Connecting...");
  const [isLoaded, setIsLoaded] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const cloudSyncTimeoutRef = useRef(null);
  const sseSourceRef = useRef(null);

  // Storage key scoped to current user so different accounts on same device stay separate
  const storageKey = currentUser
    ? `${STORAGE_KEY}_${String(currentUser).trim().toLowerCase()}`
    : STORAGE_KEY;

  // 1. Initial Local Storage Load (re-runs when currentUser changes)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const categories = ensureEmptyCustomRow(
          [...new Set([...DEFAULT_CATS, ...(parsed.categories || [])])],
          parsed.entries || {}
        );
        setState({
          categories,
          entries: parsed.entries || {},
          momCells: parsed.momCells || {},
          remarks: parsed.remarks || {},
        });
      } else {
        const categories = ensureEmptyCustomRow([...DEFAULT_CATS], {});
        setState({
          categories,
          entries: {},
          momCells: {},
          remarks: {},
        });
      }
    } catch (e) {
      console.error("Failed to load local storage:", e);
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save to Local Storage whenever state changes (after initial load)
  const saveLocal = useCallback(
    (newState) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newState));
      } catch (e) {
        console.error("Local storage save error:", e);
      }
    },
    [storageKey]
  );

  // Trigger Cloud Push with Debounce
  const triggerCloudPush = useCallback(
    (newState, immediate = false, notify = false) => {
      saveLocal(newState);
      if (cloudSyncTimeoutRef.current) {
        clearTimeout(cloudSyncTimeoutRef.current);
      }

      setCloudStatus("syncing");
      setCloudStatusText("Syncing...");

      const doPush = async () => {
        try {
          const res = await pushStateToCloud(newState, currentUser);
          setCloudStatus(res.status);
          setCloudStatusText(res.message);
          if (notify && res.status === "synced" && showToast) {
            showToast("Synced to Cloud!");
          }
        } catch (err) {
          setCloudStatus("offline");
          setCloudStatusText("Offline (Saved Locally)");
        }
      };

      if (immediate) {
        doPush();
      } else {
        cloudSyncTimeoutRef.current = setTimeout(doPush, 700);
      }
    },
    [saveLocal, showToast, currentUser]
  );

  // Pull Cloud Data
  const pullCloudData = useCallback(
    async (isBackground = false) => {
      const config = getFirebaseConfig(currentUser);
      if (!config.baseUrl) {
        setCloudStatus("offline");
        setCloudStatusText("Offline (Local Only)");
        return;
      }

      if (!isBackground) {
        setCloudStatus("syncing");
        setCloudStatusText("Connecting...");
      }

      try {
        const res = await fetchStateFromCloud(currentUser);
        if (res.status === "synced" && res.data) {
          const current = stateRef.current;
          const mergedCategories = ensureEmptyCustomRow(
            [
              ...new Set([
                ...DEFAULT_CATS,
                ...(res.data.categories || []),
                ...current.categories,
              ]),
            ],
            { ...current.entries, ...res.data.entries }
          );

          const mergedState = {
            categories: mergedCategories,
            entries: { ...current.entries, ...res.data.entries },
            momCells: { ...current.momCells, ...res.data.momCells },
            remarks: { ...current.remarks, ...(res.data.remarks || {}) },
          };

          setState(mergedState);
          saveLocal(mergedState);
          setCloudStatus("synced");
          setCloudStatusText("Cloud Synced");
          if (!isBackground && showToast) {
            showToast("Cloud data loaded!");
          }
        } else if (res.status === "empty") {
          // Cloud node empty, push initial local data
          triggerCloudPush(stateRef.current, true);
        } else if (res.status === "error_perm") {
          setCloudStatus("error_perm");
          setCloudStatusText("Cloud Sync Paused");
          if (!isBackground && showToast) {
            showToast("Cloud sync paused: Check database rules");
          }
        } else {
          setCloudStatus("offline");
          setCloudStatusText("Offline");
        }
      } catch (err) {
        setCloudStatus("offline");
        setCloudStatusText("Offline");
      }
    },
    [saveLocal, showToast, triggerCloudPush, currentUser]
  );

  // Real-time Server-Sent Events (SSE) Listener
  useEffect(() => {
    if (!isLoaded) return;

    // Initial pull
    pullCloudData(false);

    const config = getFirebaseConfig(currentUser);
    if (!config.sseUrl) return;

    try {
      const source = new EventSource(config.sseUrl);
      sseSourceRef.current = source;

      source.addEventListener("put", (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (
            parsed &&
            parsed.path === "/" &&
            parsed.data &&
            parsed.data.entries
          ) {
            // Avoid clobbering active input user is typing into
            if (
              document.activeElement &&
              document.activeElement.matches(".amount, .cat-edit, .cell-remark-input")
            ) {
              return;
            }

            const cloudState = parsed.data;
            const decodedEntries = {};
            for (const k in cloudState.entries || {}) {
              decodedEntries[decodeFirebaseKey(k)] = cloudState.entries[k];
            }
            const decodedMomCells = {};
            for (const k in cloudState.momCells || {}) {
              decodedMomCells[decodeFirebaseKey(k)] = cloudState.momCells[k];
            }
            const decodedRemarks = {};
            for (const k in cloudState.remarks || {}) {
              decodedRemarks[decodeFirebaseKey(k)] = cloudState.remarks[k];
            }

            const newCategories = ensureEmptyCustomRow(
              [...new Set([...DEFAULT_CATS, ...(cloudState.categories || [])])],
              decodedEntries
            );

            const nextState = {
              categories: newCategories,
              entries: decodedEntries,
              momCells: decodedMomCells,
              remarks: decodedRemarks,
            };

            setState(nextState);
            saveLocal(nextState);
            setCloudStatus("synced");
            setCloudStatusText("Cloud Synced");
          }
        } catch (err) {}
      });

      source.onerror = () => {
        try {
          source.close();
        } catch (e) {}
      };
    } catch (e) {}

    // Focus refresh
    const onFocus = () => {
      pullCloudData(true);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      if (sseSourceRef.current) {
        try {
          sseSourceRef.current.close();
        } catch (e) {}
      }
      window.removeEventListener("focus", onFocus);
      if (cloudSyncTimeoutRef.current) {
        clearTimeout(cloudSyncTimeoutRef.current);
      }
    };
  }, [isLoaded, pullCloudData, saveLocal, currentUser]);

  // Update Amount Action
  const updateAmount = useCallback(
    (key, value) => {
      setState((prev) => {
        const nextEntries = { ...prev.entries };
        const num = Number(value);
        if (num > 0) {
          nextEntries[key] = num;
        } else {
          delete nextEntries[key];
        }

        const nextCategories = ensureEmptyCustomRow(
          prev.categories,
          nextEntries
        );
        const nextState = {
          ...prev,
          categories: nextCategories,
          entries: nextEntries,
        };

        triggerCloudPush(nextState, false);
        return nextState;
      });
    },
    [triggerCloudPush]
  );

  // Update Remark Action
  const updateRemark = useCallback(
    (key, value) => {
      setState((prev) => {
        const nextRemarks = { ...(prev.remarks || {}) };
        const text = String(value || "").trim();
        if (text) {
          nextRemarks[key] = text;
        } else {
          delete nextRemarks[key];
        }

        const nextState = { ...prev, remarks: nextRemarks };
        triggerCloudPush(nextState, false);
        return nextState;
      });
    },
    [triggerCloudPush]
  );

  // Toggle Mom's Account Checkbox Action
  const toggleMomCell = useCallback(
    (key) => {
      setState((prev) => {
        const nextMom = { ...prev.momCells };
        if (nextMom[key]) {
          delete nextMom[key];
        } else {
          nextMom[key] = true;
        }

        const nextState = { ...prev, momCells: nextMom };
        triggerCloudPush(nextState, false);
        return nextState;
      });
    },
    [triggerCloudPush]
  );

  // Rename Category Action
  const renameCategory = useCallback(
    (oldName, newName) => {
      const trimmed = (newName || "").trim();
      if (!trimmed || trimmed === oldName) return false;

      let conflict = false;
      setState((prev) => {
        if (prev.categories.includes(trimmed)) {
          conflict = true;
          return prev;
        }

        const idx = prev.categories.indexOf(oldName);
        if (idx === -1) return prev;

        const nextCats = [...prev.categories];
        nextCats[idx] = trimmed;

        const nextEntries = {};
        for (const k in prev.entries) {
          const [c, d] = k.split("|");
          nextEntries[`${c === oldName ? trimmed : c}|${d}`] = prev.entries[k];
        }

        const nextMom = {};
        for (const k in prev.momCells) {
          const [c, d] = k.split("|");
          nextMom[`${c === oldName ? trimmed : c}|${d}`] = prev.momCells[k];
        }

        const nextRemarks = {};
        for (const k in prev.remarks || {}) {
          const [c, d] = k.split("|");
          nextRemarks[`${c === oldName ? trimmed : c}|${d}`] = prev.remarks[k];
        }

        const cleanCats = ensureEmptyCustomRow(nextCats, nextEntries);
        const nextState = {
          categories: cleanCats,
          entries: nextEntries,
          momCells: nextMom,
          remarks: nextRemarks,
        };

        triggerCloudPush(nextState, true);
        return nextState;
      });

      if (conflict) {
        if (showToast) showToast("Category name already exists!");
        return false;
      }
      if (showToast) showToast("Category updated");
      return true;
    },
    [showToast, triggerCloudPush]
  );

  // Restore State from JSON
  const restoreState = useCallback(
    (restored) => {
      const categories = ensureEmptyCustomRow(
        [...new Set([...DEFAULT_CATS, ...(restored.categories || [])])],
        restored.entries || {}
      );
      const nextState = {
        categories,
        entries: restored.entries || {},
        momCells: restored.momCells || {},
        remarks: restored.remarks || {},
      };
      setState(nextState);
      triggerCloudPush(nextState, true, true);
      if (showToast) showToast("Data restored & synced to cloud!");
    },
    [showToast, triggerCloudPush]
  );

  // Manual Sync Cloud Now
  const syncCloudNow = useCallback(async () => {
    if (showToast) showToast("Syncing with cloud...");
    await pullCloudData(false);
    await triggerCloudPush(stateRef.current, true, true);
  }, [pullCloudData, showToast, triggerCloudPush]);

  return {
    state,
    isLoaded,
    cloudStatus,
    cloudStatusText,
    updateAmount,
    updateRemark,
    toggleMomCell,
    renameCategory,
    restoreState,
    syncCloudNow,
  };
}
