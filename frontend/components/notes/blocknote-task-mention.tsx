import { createReactInlineContentSpec } from "@blocknote/react";

export const TaskMention = createReactInlineContentSpec(
  {
    type: "taskMention",
    propSchema: {
      taskId: { default: "0" },
      title: { default: "Unknown Task" },
      status: { default: "PENDING" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const statusColors: Record<string, string> = {
        PENDING: "#f59e0b",
        IN_PROGRESS: "#3b82f6",
        COMPLETED: "#22c55e",
        CANCELLED: "#ef4444",
      };
      const color = statusColors[props.inlineContent.props.status] || "#6b7280";
      return (
        <a
          href={`/tasks/${props.inlineContent.props.taskId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            padding: "1px 6px",
            borderRadius: "4px",
            backgroundColor: color + "15",
            color: color,
            fontWeight: 500,
            fontSize: "0.875rem",
            textDecoration: "none",
            border: "1px solid " + color + "30",
          }}
        >
          #{props.inlineContent.props.taskId}: {props.inlineContent.props.title}
        </a>
      );
    },
  }
);

export type TaskMentionInlineContent = {
  type: "taskMention";
  props: {
    taskId: string;
    title: string;
    status: string;
  };
};
