resource "aws_sqs_queue" "lambda_input_queue" {
  name = "reservation-request-queue"
}

resource "aws_sqs_queue_policy" "lambda_input_queue_policy" {
  queue_url = aws_sqs_queue.lambda_input_queue.url

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "sqspolicy",
  "Statement": [
    {
      "Sid": "First",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "sqs:SendMessage",
      "Resource": "${aws_sqs_queue.lambda_input_queue.arn}",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "${aws_lambda_function.reservation_lambda.arn}"
        }
      }
    }
  ]
}
POLICY
}