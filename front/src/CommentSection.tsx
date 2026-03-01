import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ThumbDown, ThumbUp, Reply } from "@mui/icons-material";

export type CommentRow = {
  id: number;
  recipeId: number;
  username: string;
  parentId: number | null;
  message: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  score: number;
  myVote: number | null;
};

type CommentNode = CommentRow & { replies: CommentNode[] };

function buildCommentTree(commentRows: CommentRow[]): CommentNode[] {
  const commentNodeById = new Map<number, CommentNode>();

  for (const commentRow of commentRows) {
    commentNodeById.set(commentRow.id, { ...commentRow, replies: [] });
  }

  const rootComments: CommentNode[] = [];

  for (const commentNode of commentNodeById.values()) {
    const parentCommentId = commentNode.parentId;

    if (parentCommentId && commentNodeById.has(parentCommentId)) {
      const parentCommentNode = commentNodeById.get(parentCommentId)!;
      parentCommentNode.replies.push(commentNode);
    } else {
      rootComments.push(commentNode);
    }
  }

  const compareByCreatedAtAscending = (left: CommentNode, right: CommentNode) =>
    left.createdAt.localeCompare(right.createdAt);

  const sortNodeAndDescendants = (currentNode: CommentNode) => {
    currentNode.replies.sort(compareByCreatedAtAscending);
    currentNode.replies.forEach(sortNodeAndDescendants);
  };

  rootComments.sort(compareByCreatedAtAscending);
  rootComments.forEach(sortNodeAndDescendants);

  return rootComments;
}

function formatTimestamp(isoTimestamp: string) {
  try {
    return new Date(isoTimestamp).toLocaleString();
  } catch {
    return isoTimestamp;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function UserAvatar({ username }: { username: string }) {
  return (
    <Avatar sx={{ bgcolor: "#ff0000", width: 36, height: 36 }}>
      {username?.[0]?.toUpperCase() ?? "?"}
    </Avatar>
  );
}

function VoteButtons({
  score,
  myVote,
  onVote,
  disabled,
}: {
  score: number;
  myVote: number | null;
  onVote: (newVoteValue: 1 | -1 | 0) => void;
  disabled?: boolean;
}) {
  const isUpvotedByMe = myVote === 1;
  const isDownvotedByMe = myVote === -1;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <IconButton
        size="small"
        aria-label="upvote"
        onClick={() => onVote(isUpvotedByMe ? 0 : 1)}
        color={isUpvotedByMe ? "primary" : "default"}
        disabled={disabled}
      >
        <ThumbUp fontSize="small" />
      </IconButton>

      <Typography variant="body2" sx={{ minWidth: 24, textAlign: "center" }}>
        {score}
      </Typography>

      <IconButton
        size="small"
        aria-label="downvote"
        onClick={() => onVote(isDownvotedByMe ? 0 : -1)}
        color={isDownvotedByMe ? "primary" : "default"}
        disabled={disabled}
      >
        <ThumbDown fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function CommentItem({
  commentNode,
  nestingDepth,
  currentUsername,
  onCreateReply,
  onVoteOnComment,
  onEditComment,
  onDeleteComment,
}: {
  commentNode: CommentNode;
  nestingDepth: number;
  currentUsername: string | null;
  onCreateReply: (parentCommentId: number, replyMessage: string) => Promise<void>;
  onVoteOnComment: (commentId: number, newVoteValue: 1 | -1 | 0) => Promise<void>;
  onEditComment: (commentId: number, newMessage: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}) {
  const [isReplyEditorOpen, setIsReplyEditorOpen] = useState(false);
  const [replyDraftMessage, setReplyDraftMessage] = useState("");
  const [isEditEditorOpen, setIsEditEditorOpen] = useState(false);
  const [editDraftMessage, setEditDraftMessage] = useState(commentNode.message);
  const isMe = !!currentUsername && commentNode.username === currentUsername;
  const isDeleted = !!commentNode.deletedAt;

  useEffect(() => {
    if (!isEditEditorOpen) setEditDraftMessage(commentNode.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentNode.id, commentNode.message, isEditEditorOpen]);

  return (
    <Box
      sx={{
        pl: nestingDepth === 0 ? 0 : 2,
        borderLeft: nestingDepth === 0 ? "none" : "2px solid",
        borderColor: nestingDepth === 0 ? "transparent" : "divider",
        mt: nestingDepth === 0 ? 0 : 1.5,
      }}
    >
      <Card variant="outlined" sx={{ bgcolor: "background.paper" }}>
        <CardContent sx={{ pb: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <UserAvatar username={commentNode.username} />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                <Typography variant="subtitle2" noWrap>
                  {commentNode.username}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  {formatTimestamp(commentNode.createdAt)}
                </Typography>

                {commentNode.editedAt && !isDeleted && (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    • edited from original
                  </Typography>
                )}

                {isDeleted && (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    • deleted
                  </Typography>
                )}
              </Stack>

              {!isEditEditorOpen ? (
                <Typography
                  variant="body2"
                  sx={{ mt: 0.75, whiteSpace: "pre-wrap", opacity: isDeleted ? 0.6 : 1 }}
                >
                  {commentNode.message}
                </Typography>
              ) : (
                <Collapse in={isEditEditorOpen} timeout="auto" unmountOnExit>
                  <Stack spacing={1} sx={{ mt: 1.25 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Edit comment"
                      value={editDraftMessage}
                      onChange={(event) => setEditDraftMessage(event.target.value)}
                      multiline
                      minRows={2}
                      disabled={isDeleted}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => {
                          setIsEditEditorOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={isDeleted || editDraftMessage.trim().length === 0}
                        onClick={async () => {
                          const trimmed = editDraftMessage.trim();
                          if (!trimmed) return;
                          await onEditComment(commentNode.id, trimmed);
                          setIsEditEditorOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </Stack>
                  </Stack>
                </Collapse>
              )}

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: "wrap" }}>
                <VoteButtons
                  score={commentNode.score}
                  myVote={commentNode.myVote}
                  onVote={(newVoteValue) => onVoteOnComment(commentNode.id, newVoteValue)}
                  disabled={!currentUsername}
                />

                <Button
                  size="small"
                  startIcon={<Reply fontSize="small" />}
                  onClick={() => setIsReplyEditorOpen((previousOpen) => !previousOpen)}
                  disabled={!currentUsername || isDeleted}
                >
                  Reply
                </Button>

                {isMe && !isDeleted && (
                  <>
                    <Button
                      size="small"
                      onClick={() => {
                        setIsEditEditorOpen((prev) => !prev);
                        setIsReplyEditorOpen(false);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        const ok = window.confirm("Delete this comment?");
                        if (!ok) return;
                        await onDeleteComment(commentNode.id);
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </Stack>

              <Collapse in={isReplyEditorOpen} timeout="auto" unmountOnExit>
                <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Write a reply"
                    value={replyDraftMessage}
                    onChange={(event) => setReplyDraftMessage(event.target.value)}
                    multiline
                    minRows={2}
                    disabled={isDeleted}
                  />

                  <Button
                    variant="contained"
                    sx={{ alignSelf: "flex-start", whiteSpace: "nowrap" }}
                    disabled={isDeleted || replyDraftMessage.trim().length === 0}
                    onClick={async () => {
                      const trimmedReplyMessage = replyDraftMessage.trim();
                      if (!trimmedReplyMessage) return;

                      await onCreateReply(commentNode.id, trimmedReplyMessage);

                      setReplyDraftMessage("");
                      setIsReplyEditorOpen(false);
                    }}
                  >
                    Post
                  </Button>
                </Stack>
              </Collapse>

              {commentNode.replies.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Stack spacing={1.5}>
                    {commentNode.replies.map((replyNode) => (
                      <CommentItem
                        key={replyNode.id}
                        commentNode={replyNode}
                        nestingDepth={nestingDepth + 1}
                        currentUsername={currentUsername}
                        onCreateReply={onCreateReply}
                        onVoteOnComment={onVoteOnComment}
                        onEditComment={onEditComment}
                        onDeleteComment={onDeleteComment}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function CommentSection({ recipeId }: { recipeId: number }) {
  const [commentRows, setCommentRows] = useState<CommentRow[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [newCommentDraft, setNewCommentDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentUsername = getCookie("username");
  const commentTree = useMemo(() => buildCommentTree(commentRows), [commentRows]);

  async function loadCommentsForRecipe() {
    setIsLoadingComments(true);
    setErrorMessage(null);

    try {
      const response = await axios.get(`/api/recipe/${recipeId}/comments`, { withCredentials: true });

      if (response.status >= 400) {
        setErrorMessage(response.data?.error ?? "Failed to load comments");
        setCommentRows([]);
      } else {
        setCommentRows(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      setErrorMessage("Failed to load comments");
      setCommentRows([]);
    } finally {
      setIsLoadingComments(false);
    }
  }

  useEffect(() => {
    loadCommentsForRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function createComment(message: string, parentCommentId?: number) {
    setIsPostingComment(true);
    setErrorMessage(null);

    try {
      const response = await axios.post(
        `/api/recipe/${recipeId}/comments`,
        {
          message,
          parentId: parentCommentId ?? undefined,
        },
        { withCredentials: true },
      );

      if (response.status === 401) {
        setErrorMessage("Please log in to comment.");
        return;
      }

      if (response.status >= 400) {
        const fallbackError =
          Array.isArray(response.data?.errors) ? response.data.errors.join(", ") : "Failed to post";
        setErrorMessage(response.data?.error ?? fallbackError);
        return;
      }

      await loadCommentsForRecipe();
    } finally {
      setIsPostingComment(false);
    }
  }

  async function editComment(commentId: number, newMessage: string) {
    setErrorMessage(null);

    try {
      const response = await axios.patch(
        `/api/comments/${commentId}`,
        { message: newMessage },
        { withCredentials: true },
      );

      if (response.status === 401) {
        setErrorMessage("Please log in to edit comments.");
        await loadCommentsForRecipe();
        return;
      }

      if (response.status === 403) {
        setErrorMessage("You can only edit your own comments.");
        return;
      }

      if (response.status >= 400) {
        const fallbackError =
          Array.isArray(response.data?.errors) ? response.data.errors.join(", ") : "Failed to edit";
        setErrorMessage(response.data?.error ?? fallbackError);
        return;
      }

      await loadCommentsForRecipe();
    } catch {
      setErrorMessage("Failed to edit comment");
      await loadCommentsForRecipe();
    }
  }

  async function deleteComment(commentId: number) {
    setErrorMessage(null);

    try {
      const response = await axios.delete(`/api/comments/${commentId}`, { withCredentials: true });

      if (response.status === 401) {
        setErrorMessage("Please log in to delete comments.");
        await loadCommentsForRecipe();
        return;
      }

      if (response.status === 403) {
        setErrorMessage("You can only delete your own comments.");
        return;
      }

      if (response.status >= 400) {
        setErrorMessage(response.data?.error ?? "Failed to delete comment");
        return;
      }

      await loadCommentsForRecipe();
    } catch {
      setErrorMessage("Failed to delete comment");
      await loadCommentsForRecipe();
    }
  }

  async function voteOnComment(commentId: number, newVoteValue: 1 | -1 | 0) {
    setErrorMessage(null);
    setCommentRows((previousRows) =>
      previousRows.map((commentRow) => {
        if (commentRow.id !== commentId) return commentRow;

        const previousVoteValue = commentRow.myVote ?? 0;
        const nextVoteValue = newVoteValue;
        const nextScore = commentRow.score - previousVoteValue + nextVoteValue;

        return {
          ...commentRow,
          myVote: nextVoteValue === 0 ? null : nextVoteValue,
          score: nextScore,
        };
      }),
    );

    const response = await axios.post(
      `/api/comments/${commentId}/vote`,
      { value: newVoteValue },
      { withCredentials: true },
    );

    if (response.status === 401) {
      setErrorMessage("Please log in to vote.");
      await loadCommentsForRecipe();
      return;
    }

    if (response.status >= 400) {
      setErrorMessage(response.data?.error ?? "Failed to vote");
      await loadCommentsForRecipe();
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Comments</Typography>
        <Typography variant="body2" color="text.secondary">
          Ask a question, leave a recipe tip, or reply to a post.
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <TextField
              label="Add a comment"
              value={newCommentDraft}
              onChange={(event) => setNewCommentDraft(event.target.value)}
              multiline
              minRows={3}
              placeholder="What did you think of this recipe?"
              disabled={!currentUsername}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                disabled={!currentUsername || isPostingComment || newCommentDraft.trim().length === 0}
                onClick={async () => {
                  const trimmedNewComment = newCommentDraft.trim();
                  if (!trimmedNewComment) return;

                  await createComment(trimmedNewComment);
                  setNewCommentDraft("");
                }}
              >
                Post comment
              </Button>
            </Stack>

            {!currentUsername && (
              <Typography variant="caption" color="text.secondary">
                You must be logged in to post, vote, edit, or delete comments.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {errorMessage && (
        <Typography sx={{ mt: 1.5 }} color="error" variant="body2">
          {errorMessage}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {isLoadingComments ? (
        <Typography color="text.secondary">Loading comments…</Typography>
      ) : commentTree.length === 0 ? (
        <Typography color="text.secondary">No comments have been posted yet.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {commentTree.map((rootCommentNode) => (
            <CommentItem
              key={rootCommentNode.id}
              commentNode={rootCommentNode}
              nestingDepth={0}
              currentUsername={currentUsername}
              onCreateReply={(parentCommentId, replyMessage) => createComment(replyMessage, parentCommentId)}
              onVoteOnComment={voteOnComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
