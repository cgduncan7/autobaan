resource "aws_sfn_state_machine" "reservation_state_machine" {
  name     = "reservation-state-machine"
  role_arn = aws_iam_role.reservation_scheduler_lambda_iam_role.arn

  definition = jsonencode({
    Comment = "Schedules and attempts to create a reservation based on incoming request to API",
    StartAt = "schedule-reservation",
    States  = {
      schedule-reservation = {
        Type   = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = format("%s:$LATEST", aws_lambda_function.reservation_scheduler_lambda.arn)
          Payload = {}
        }
        End = true
      }
    }
  })

  depends_on = [
    aws_iam_role.reservation_scheduler_lambda_iam_role
  ]
}