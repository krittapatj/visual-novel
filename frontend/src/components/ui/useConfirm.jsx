import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export default function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolveRef = useRef(null);
  const confirm = useCallback((nextOptions) => new Promise((resolve) => {
    if (resolveRef.current) resolveRef.current(false);
    resolveRef.current = resolve;
    setOptions(nextOptions);
  }), []);
  const settle = useCallback((answer) => {
    resolveRef.current?.(answer);
    resolveRef.current = null;
    setOptions(null);
  }, []);
  useEffect(() => () => { resolveRef.current?.(false); resolveRef.current = null; }, []);
  const dialog = <ConfirmDialog open={Boolean(options)} {...(options || {})} onConfirm={() => settle(true)} onCancel={() => settle(false)} />;
  return { confirm, dialog };
}
