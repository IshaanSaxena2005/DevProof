import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { ApiError } from "./api.mts";

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the loader — call after a mutation. */
  reload: () => void;
}

/**
 * Loads a value on mount and whenever `deps` change.
 *
 * `load` is intentionally excluded from the effect's dependencies: callers pass
 * inline closures, which would be a new reference every render and loop
 * forever. Put anything the closure reads into `deps` instead.
 *
 * Background refreshes (via `reload`) preserve the current `data` while the new
 * value loads, so a successful action like connecting a platform does not replace
 * the whole dashboard with a loading block. The initial mount still shows loading.
 */
export function useResource<T>(load: () => Promise<T>, deps: DependencyList = []): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const isInitialMount = useRef(true);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    // Guards against a late response from a superseded request overwriting
    // state after the deps changed or the component unmounted.
    let active = true;

    // Only show loading state on initial mount; background refreshes preserve
    // the current data so the UI remains visible.
    if (!isInitialMount.current) {
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);

    load()
      .then((result) => {
        if (active) {
          setData(result);
          if (isInitialMount.current) {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong loading this data.");
        if (isInitialMount.current) {
          setLoading(false);
        }
      });

    isInitialMount.current = false;

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}
