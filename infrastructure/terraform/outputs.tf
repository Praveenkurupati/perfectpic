# infrastructure/terraform/outputs.tf

output "media_bucket_id" {
  description = "Name of the S3 media storage bucket"
  value       = aws_s3_bucket.media_bucket.id
}

output "media_bucket_arn" {
  description = "ARN of the S3 media storage bucket"
  value       = aws_s3_bucket.media_bucket.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront CDN distribution"
  value       = aws_cloudfront_distribution.media_cdn.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront CDN distribution"
  value       = aws_cloudfront_distribution.media_cdn.domain_name
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for operational alerts"
  value       = aws_sns_topic.ops_alerts.arn
}
