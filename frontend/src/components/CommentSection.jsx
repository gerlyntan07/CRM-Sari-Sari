import React, { useState } from "react";
import { MessageSquare, Lock, Globe, Send, MessageCircle } from "lucide-react";

function CommentSection({ comments = [], onAddComment, currentUser }) {
  const [newComment, setNewComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (onAddComment) {
        await onAddComment({
          comment: newComment.trim(),
          is_private: isPrivate,
        });
      }
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200 mt-5">
      <h3 className="text-lg font-semibold text-gray-800 break-words border-b border-gray-300 py-2 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        Comments
        {comments.length > 0 && (
          <span className="text-sm font-normal text-gray-500">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Comments List or Empty State */}
      <div className="mt-4">
        {comments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-1">
              No comments yet
            </h4>
            <p className="text-sm text-gray-500 max-w-sm">
              Be the first to share your thoughts. Start a conversation by
              adding a comment below.
            </p>
          </div>
        ) : (
          /* Comments List */
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {comment.comment_creator?.first_name?.[0] ||
                      comment.comment_creator?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">
                      {comment.comment_creator?.first_name ||
                        comment.comment_creator?.email ||
                        "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    {comment.is_private && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap break-words">
                    {comment.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input Area */}
      <form onSubmit={handleSubmit} className="mt-6 pt-4 border-t border-gray-200">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Privacy Toggle */}
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isPrivate
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {isPrivate ? (
              <>
                <Lock className="w-4 h-4" />
                Private
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Public
              </>
            )}
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommentSection;
