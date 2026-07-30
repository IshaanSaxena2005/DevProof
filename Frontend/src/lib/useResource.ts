import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ApiError } from "./api";

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
 */
export function useResource<T>(load: () => Promise<T>, deps: DependencyList = []): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    // Guards against a late response from a superseded request overwriting
    // state after the deps changed or the component unmounted.
    let active = true;

    setLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong loading this data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}
