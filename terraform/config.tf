terraform {
  backend "s3" {
    encrypt        = true
    bucket         = "cgduncan7-terraform-state-euc1"
    key            = "autobaan-dev"
    region         = "eu-central-1"
    dynamodb_table = "cgduncan7-terraform-state-lock-euc1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }
  required_version = ">= 1.0.0"
}