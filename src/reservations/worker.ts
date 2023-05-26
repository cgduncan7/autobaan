import { Inject } from '@nestjs/common'
import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { Reservation } from './entity'
import { BaanReserverenService } from '../runner/baanreserveren/service'
import { LoggerService } from '../logger/service'

@Processor(RESERVATIONS_QUEUE_NAME)
export class ReservationsWorker {
  constructor(
    @Inject(BaanReserverenService)
    private readonly brService: BaanReserverenService,

    @Inject(LoggerService)
    private readonly logger: LoggerService,
  ) {}

  @Process()
  async handleReservationJob(job: Job<Reservation>) {
    const reservation = plainToInstance(Reservation, job.data, { groups: ['password'] })
    this.logger.log('Handling reservation', { reservation: instanceToPlain(reservation) })
    await this.performReservation(reservation)
  }

  async performReservation(reservation: Reservation) {
    await this.brService.performReservation(reservation)
  }
}