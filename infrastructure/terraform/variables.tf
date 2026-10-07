# infrastructure/terraform/variables.tf

variable "aws_region" {
  description = "AWS region for deployment (Default: Mumbai ap-south-1)"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Apex domain name for the photobook platform"
  type        = string
  default     = "perfectpic.in"
}

variable "media_bucket_name" {
  description = "AWS S3 bucket name for customer photobook master assets and press PDFs"
  type        = string
  default     = "perfectpic-storage-prod-assets"
}

variable "ec2_instance_id" {
  description = "EC2 instance ID running the API & Print Worker services"
  type        = string
  default     = "i-perfectpic-prod-api"
}

variable "alert_email" {
  description = "Operations team email for SNS alarm notifications"
  type        = string
  default     = "ops@perfectpic.in"
}
