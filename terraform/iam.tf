resource "aws_iam_role" "reservation_scheduler_lambda_iam_role" {
  name = "reservation_scheduler_lambda_iam_role"

  assume_role_policy = jsonencode({
    "Version"   = "2012-10-17",
    "Statement" = [
      {
        "Sid"    = "reservation_scheduler_lambda-assume_role"
        "Action"    = "sts:AssumeRole",
        "Principal" = {
          "Service" = "lambda.amazonaws.com"
        },
        "Effect" = "Allow",
      }
    ]
  })
}

resource "aws_iam_role" "reservation_state_machine_iam_role" {
  name = "reservation_state_machine_iam_role"

  assume_role_policy = jsonencode({
    "Version"   = "2012-10-17",
    "Statement" = [
      {
        "Sid"      = "reservation_state_machine-invoke_lambda"
        "Action"   = "lambda:InvokeAsync"
        "Effect"   = "Allow"
        "Resource" = aws_lambda_function.reservation_scheduler_lambda.arn
      }
    ]
  })
}