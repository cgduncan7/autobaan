resource "aws_lambda_function" "reservation_lambda" {
  filename      = "reservation-lambda.zip"
  function_name = "process-reservation-request"
  role          = aws_iam_role.reservation_lambda_iam_role.arn
  handler       = "index.handler"

  source_code_hash = filebase64sha256("reservation-lambda.zip")

  runtime = "nodejs14.x"
}

resource "aws_iam_role" "reservation_lambda_iam_role" {
  name = "reservation_lambda_iam_role"

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