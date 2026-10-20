import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, X, Check, AlertCircle, Edit2, Plus } from "lucide-react";
import { githubService } from "../services/github";
import { ApiError } from "../lib/api.mts";

interface RepositoryDescriptionEditorProps {
  repositoryId: string;
  currentDescription: string | null;
  onUpdate: (newDescription: string | null) => void;
  disabled?: boolean;
}

export default function RepositoryDescriptionEditor({
  repositoryId,
  currentDescription,
  onUpdate,
  disabled = false
}: RepositoryDescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasDescription = currentDescription !== null && currentDescription.trim() !== "";

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditing) {
        handleCancel();
      }
    };
    if (isEditing) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (isSaving) return;

    const trimmed = description.trim();
    if (trimmed.length > 2000) {
      setError("Description must be 2000 characters or less");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await githubService.updateRepositoryDescription(repositoryId, trimmed);
      onUpdate(trimmed || null);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized) {
          setError("GitHub authorization expired. Please reconnect your account.");
        } else if (err.statusCode === 403) {
          setError("Insufficient permissions. Ensure you have write access to this repository.");
        } else if (err.statusCode === 429) {
          setError("GitHub rate limit exceeded. Please try again later.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to update description. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(currentDescription ?? "");
    setError(null);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setDescription(currentDescription ?? "");
    setError(null);
    setIsEditing(true);
  };

  if (disabled) {
    return (
      <p className="text-xs line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
        {currentDescription ?? "No description provided."}
      </p>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-xs line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
              {currentDescription ?? "No description provided."}
            </p>
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary/70 hover:text-primary transition-colors cursor-pointer"
              aria-label={hasDescription ? "Edit repository description" : "Add repository description"}
            >
              {hasDescription ? (
                <>
                  <Edit2 className="w-3 h-3" />
                  Edit description
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Add description
                </>
              )}
            </button>
            <div role="status" aria-live="polite">
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-[11px] text-primary"
                >
                  <Check className="w-3 h-3" />
                  Description updated
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <label htmlFor={`repo-desc-${repositoryId}`} className="sr-only">
              Repository description
            </label>
            <textarea
              id={`repo-desc-${repositoryId}`}
              ref={textareaRef}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              placeholder="Enter a repository description..."
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all resize-none"
              disabled={isSaving}
              aria-describedby={error ? `repo-desc-error-${repositoryId}` : undefined}
              aria-invalid={error !== null}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30" aria-live="polite">
                  {description.length}/2000
                </span>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    id={`repo-desc-error-${repositoryId}`}
                    role="alert"
                    className="flex items-center gap-1 text-[10px] text-red-400"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Cancel editing description"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || description.trim().length > 2000}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    backgroundColor: isSaving ? "#0a3d00" : "#16ff00",
                    color: "#000"
                  }}
                  aria-label="Save repository description"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
