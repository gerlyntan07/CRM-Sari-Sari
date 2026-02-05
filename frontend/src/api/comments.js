import api from "../api";

export async function fetchComments({ relatedType, relatedId }) {
  const res = await api.get("/comments", {
    params: {
      related_type: relatedType,
      related_id: relatedId,
    },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createComment({ relatedType, relatedId, comment, isPrivate }) {
  const res = await api.post("/comments", {
    related_type: relatedType,
    related_id: relatedId,
    comment,
    is_private: Boolean(isPrivate),
  });
  return res.data;
}
