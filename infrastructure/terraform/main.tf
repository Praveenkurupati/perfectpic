# infrastructure/terraform/main.tf
# Terraform IaC Configuration for PerfectPic Enterprise Photobook Platform

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  backend "s3" {
    bucket         = "perfectpic-terraform-state-prod"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "perfectpic-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PerfectPic"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "PhotobookPlatform"
    }
  }
}

# Provider for CloudFront ACM Certificate (us-east-1 requirement)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "PerfectPic"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
