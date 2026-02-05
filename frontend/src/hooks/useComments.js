import { useCallback, useEffect, useState } from "react";
import { createComment, fetchComments } from "../api/comments";

export function useComments({ relatedType, relatedId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!relatedType || !relatedId) {
      setComments([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchComments({ relatedType, relatedId });
      setComments(data);
    } finally {
      setLoading(false);
    }
  }, [relatedType, relatedId]);

  const addComment = useCallback(
    async ({ comment, is_private }) => {
      if (!relatedType || !relatedId) return;
      await createComment({
        relatedType,
        relatedId,
        comment,
        isPrivate: is_private,
      });
      await refresh();
    },
    [relatedType, relatedId, refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { comments, loading, refresh, addComment };
}
