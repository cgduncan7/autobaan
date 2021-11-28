resource "aws_lambda_function" "reservation_scheduler_lambda" {
  filename      = "../deploy/reservationScheduler.zip"
  runtime       = "nodejs14.x"
  function_name = "reservation-scheduler"
  handler       = "index.handler"

  source_code_hash = filebase64sha256("../deploy/reservationScheduler.zip")

  role = aws_iam_role.reservation_scheduler_lambda_iam_role.arn
}

resource "aws_iam_role" "reservation_scheduler_lambda_iam_role" {
  name = "reservation_scheduler_lambda_iam_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_function_event_invoke_config" "reservation_scheduler_lambda_config" {
  function_name                = aws_lambda_function.reservation_scheduler_lambda.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}