-- Add context column to lessons table to track the lesson topic
-- (commit_message, pr_comment, github_issue, slack, general)
ALTER TABLE lessons ADD COLUMN context TEXT;
