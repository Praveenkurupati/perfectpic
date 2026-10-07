# infrastructure/terraform/cloudwatch.tf
# CloudWatch Alarms & Observability Metric Triggers

resource "aws_sns_topic" "ops_alerts" {
  name = "perfectpic-ops-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "ops_email_sub" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# 1. EC2 Backend Health Check Failure Alarm (SRE-02)
resource "aws_cloudwatch_metric_alarm" "ec2_healthcheck_alarm" {
  alarm_name          = "PerfectPic-EC2-HealthCheck-Failure"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "Triggers when EC2 backend /api/health/live probe fails or system status check fails"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    InstanceId = var.ec2_instance_id
  }
}

# 2. High 5xx Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "high_5xx_alarm" {
  alarm_name          = "PerfectPic-High-5xx-ErrorRate"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "API_EXCEPTION"
  namespace           = "PerfectPic/Production"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Triggers when backend API 5xx errors exceed 5 occurrences within a 5-minute window"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"
}

# 3. High API Latency P99 Alarm
resource "aws_cloudwatch_metric_alarm" "latency_p99_alarm" {
  alarm_name          = "PerfectPic-High-API-Latency-P99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "LatencyP99"
  namespace           = "PerfectPic/Production"
  period              = 300
  statistic           = "Average"
  threshold           = 1200
  alarm_description   = "Triggers when P99 response latency exceeds 1200ms"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"
}

# 4. BullMQ Queue Backlog Alarm
resource "aws_cloudwatch_metric_alarm" "queue_backlog_alarm" {
  alarm_name          = "PerfectPic-BullMQ-Queue-Backlog"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "QueueBacklog"
  namespace           = "PerfectPic/Production"
  period              = 300
  statistic           = "Average"
  threshold           = 50
  alarm_description   = "Triggers when render jobs in print-render-queue exceed 50 waiting jobs"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"
}
