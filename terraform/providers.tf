provider "aws" {
  profile = "default"
  region  = "eu-central-1"
  default_tags {
    tags = {
      Terraform = "true"
    }
  }
}